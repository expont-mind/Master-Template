import { createAdminClient } from "@/lib/supabase/server";
import { activeSmsProvider, sendSms } from "@/lib/sms";
import { NextRequest, NextResponse } from "next/server";

interface RecipientFilter {
  type: "all" | "filter" | "manual";
  user_status?: string;
  has_orders?: boolean;
  registered_after?: string;
  registered_before?: string;
  phones?: string[];
}

interface Recipient {
  user_id: string | null;
  phone: string;
}

interface CampaignRow {
  id: string;
  name: string;
  message: string;
  status: string;
  recipient_filter: RecipientFilter | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = ReturnType<typeof createAdminClient> & { from: (table: string) => any };

async function fetchAllPaginated<T>(
  queryBuilder: () => ReturnType<ReturnType<AnySupabase["from"]>["select"]>,
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const all: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder().range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    all.push(...rows);
    offset += PAGE_SIZE;
    hasMore = rows.length === PAGE_SIZE;
  }

  return all;
}

async function resolveRecipients(
  supabase: AnySupabase,
  filter: RecipientFilter
): Promise<Recipient[]> {
  if (filter.type === "manual") {
    return (filter.phones ?? []).map((phone) => ({
      user_id: null,
      phone: phone.replace(/\D/g, "").replace(/^976/, ""),
    }));
  }

  const buildQuery = () => {
    let query = supabase
      .from("users")
      .select("id, primary_phone")
      .not("primary_phone", "is", null);

    if (filter.type === "filter") {
      if (filter.user_status) {
        query = query.eq("status", filter.user_status);
      }
      if (filter.registered_after) {
        query = query.gte("created_at", filter.registered_after);
      }
      if (filter.registered_before) {
        query = query.lte("created_at", filter.registered_before);
      }
    }

    return query;
  };

  let filteredUsers = await fetchAllPaginated<{ id: string; primary_phone: string }>(buildQuery);

  if (filter.type === "filter" && filter.has_orders) {
    const orderRows = await fetchAllPaginated<{ user_id: string }>(() =>
      supabase.from("orders").select("user_id").not("user_id", "is", null)
    );

    const userIdsWithOrders = new Set(orderRows.map((o) => o.user_id));
    filteredUsers = filteredUsers.filter((u) => userIdsWithOrders.has(u.id));
  }

  return filteredUsers.map((u) => ({
    user_id: u.id,
    phone: u.primary_phone.replace(/^\+?976/, "").replace(/\D/g, ""),
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { campaign_id } = await request.json();

    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient() as AnySupabase;

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("sms_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single() as { data: CampaignRow | null; error: { message: string } | null };

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "sent") {
      return NextResponse.json({ error: "Campaign already sent" }, { status: 400 });
    }

    const filter = campaign.recipient_filter ?? { type: "all" as const };
    const rawRecipients = await resolveRecipients(supabase, filter);

    // Deduplicate by normalized phone number (keep first occurrence)
    const seenPhones = new Set<string>();
    const recipients = rawRecipients.filter((r) => {
      if (seenPhones.has(r.phone)) return false;
      seenPhones.add(r.phone);
      return true;
    });

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Update campaign to sending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("sms_campaigns")
      .update({
        status: "sending",
        recipient_count: recipients.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    let sentCount = 0;
    let failedCount = 0;
    let firstError = "";

    // DB-level idempotency: skip recipients that already have a `sent`
    // log for this campaign. Without this, a retried POST would
    // double-send to everyone (e.g. on Vercel function timeout retry).
    const { data: existingLogs } = await supabase
      .from("sms_logs")
      .select("phone, status")
      .eq("campaign_id", campaign_id)
      .eq("status", "sent") as {
        data: { phone: string; status: string }[] | null;
      };
    const alreadySent = new Set(
      (existingLogs ?? []).map((l) => l.phone),
    );

    const queue = recipients.filter((r) => !alreadySent.has(r.phone));

    // Concurrency-limited sender. Cap at 50 concurrent so we keep
    // throughput up without storming the SMS provider or our DB.
    const SMS_CONCURRENCY = 50;
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(SMS_CONCURRENCY, queue.length) }, async () => {
        while (cursor < queue.length) {
          const recipient = queue[cursor++];
          const result = await sendSms(recipient.phone, campaign.message);

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            if (!firstError) firstError = result.error ?? "Unknown";
          }

          const logStatus = result.success ? "sent" : "failed";
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("sms_logs").insert({
              campaign_id,
              user_id: recipient.user_id,
              phone: recipient.phone,
              message: campaign.message,
              status: logStatus,
              provider: activeSmsProvider(),
              provider_message_id: result.messageId ?? null,
              error_message: result.error ?? null,
              sent_at: result.success ? new Date().toISOString() : null,
            });
          } catch (logErr) {
            console.error("sms_logs insert error:", logErr);
          }
        }
      }),
    );

    // Use queue.length (not recipients.length) so retries are
    // evaluated correctly when some items were already sent.
    const actualTotal = queue.length || recipients.length;
    const finalStatus = failedCount >= actualTotal ? "failed" : "sent";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("sms_campaigns")
      .update({
        status: finalStatus,
        sent_count: sentCount + alreadySent.size,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return NextResponse.json({
      success: failedCount < (queue.length || recipients.length),
      sent_count: sentCount,
      failed_count: failedCount,
      total: recipients.length,
      error: failedCount > 0 ? firstError : undefined,
    });
  } catch (error) {
    console.error("SMS send error:", error);

    // Ensure the campaign doesn't stay stuck in "sending" forever
    try {
      const supabase = createAdminClient() as AnySupabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("sms_campaigns")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", (await request.clone().json()).campaign_id);
    } catch {
      // best-effort status recovery
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
