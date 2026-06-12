import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
import { activeSmsProvider, sendSms } from "@/lib/sms";
import { createAdminClient } from "@/lib/supabase/server";
import { LOCALE } from "@/lib/utils/brand-config";

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

type AdminSupabase = ReturnType<typeof createAdminClient>;

async function fetchAllPaginated<T>(
  queryBuilder: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const all: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const builder = queryBuilder() as PromiseLike<{
      data: T[] | null;
      error: { message: string } | null;
    }> & {
      range: (
        from: number,
        to: number,
      ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
    };
    const { data, error } = await builder.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    all.push(...rows);
    offset += PAGE_SIZE;
    hasMore = rows.length === PAGE_SIZE;
  }

  return all;
}

async function resolveRecipients(
  supabase: AdminSupabase,
  filter: RecipientFilter,
): Promise<Recipient[]> {
  if (filter.type === "manual") {
    return (filter.phones ?? []).map((phone) => ({
      user_id: null,
      phone: phone.replace(/\D/g, "").replace(LOCALE.phoneRegex, ""),
    }));
  }

  const buildQuery = () => {
    let query = supabase.from("users").select("id, primary_phone").not("primary_phone", "is", null);

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
      supabase.from("orders").select("user_id").not("user_id", "is", null),
    );

    const userIdsWithOrders = new Set(orderRows.map((o) => o.user_id));
    filteredUsers = filteredUsers.filter((u) => userIdsWithOrders.has(u.id));
  }

  return filteredUsers.map((u) => ({
    user_id: u.id,
    phone: u.primary_phone.replace(LOCALE.phoneRegex, "").replace(/\D/g, ""),
  }));
}

// Fetch campaign. `.single<T>()` works around TS instantiation depth
// on the 47-table union — without it `campaign` resolves to `never`.
type CampaignRow = {
  id: string;
  name: string;
  message: string;
  status: string;
  recipient_filter: RecipientFilter | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
};

const dedupByPhone = (rows: Recipient[]): Recipient[] => {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.phone)) return false;
    seen.add(r.phone);
    return true;
  });
};

/**
 * Concurrency-limited fan-out over `queue`, sending SMS and writing one
 * `sms_logs` row per attempt. Cap is 50 so we keep throughput up without
 * storming the SMS provider or our DB.
 */
async function sendCampaignBatch(
  supabase: AdminSupabase,
  campaign: CampaignRow,
  queue: Recipient[],
): Promise<{ sentCount: number; failedCount: number; firstError: string }> {
  const SMS_CONCURRENCY = 50;
  let sentCount = 0;
  let failedCount = 0;
  let firstError = "";
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

        try {
          await supabase.from("sms_logs").insert({
            campaign_id: campaign.id,
            user_id: recipient.user_id,
            phone: recipient.phone,
            message: campaign.message,
            status: result.success ? "sent" : "failed",
            provider: activeSmsProvider(),
            provider_message_id: result.messageId ?? null,
            error_message: result.error ?? null,
            sent_at: result.success ? new Date().toISOString() : null,
          } as never);
        } catch (logErr) {
          log.error("sms_logs_insert_error", logErr);
        }
      }
    }),
  );

  return { sentCount, failedCount, firstError };
}

async function loadCampaign(
  supabase: AdminSupabase,
  campaignId: string,
): Promise<{ campaign?: CampaignRow; errorResponse?: NextResponse }> {
  const { data: campaign, error } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single<CampaignRow>();

  if (error || !campaign) {
    return {
      errorResponse: NextResponse.json({ error: "Campaign not found" }, { status: 404 }),
    };
  }
  if (campaign.status === "sent") {
    return {
      errorResponse: NextResponse.json({ error: "Campaign already sent" }, { status: 400 }),
    };
  }
  return { campaign };
}

async function markCampaignSending(
  supabase: AdminSupabase,
  campaignId: string,
  recipientCount: number,
): Promise<void> {
  await supabase
    .from("sms_campaigns")
    .update({
      status: "sending",
      recipient_count: recipientCount,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", campaignId);
}

async function loadAlreadySentPhones(
  supabase: AdminSupabase,
  campaignId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("sms_logs")
    .select("phone, status")
    .eq("campaign_id", campaignId)
    .eq("status", "sent")
    .returns<{ phone: string; status: string }[]>();
  return new Set((data ?? []).map((l) => l.phone));
}

async function markCampaignDone(
  supabase: AdminSupabase,
  campaignId: string,
  finalStatus: "sent" | "failed",
  sentCount: number,
  failedCount: number,
): Promise<void> {
  await supabase
    .from("sms_campaigns")
    .update({
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", campaignId);
}

async function recoverStuckCampaign(request: NextRequest): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { campaign_id } = await request.clone().json();
    await supabase
      .from("sms_campaigns")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", campaign_id);
  } catch {
    // best-effort status recovery
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaign_id } = await request.json();
    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { campaign, errorResponse } = await loadCampaign(supabase, campaign_id);
    if (errorResponse) return errorResponse;

    const filter = campaign!.recipient_filter ?? { type: "all" as const };
    const recipients = dedupByPhone(await resolveRecipients(supabase, filter));
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    await markCampaignSending(supabase, campaign_id, recipients.length);

    // DB-level idempotency: skip recipients that already have a `sent`
    // log for this campaign. Without this, a retried POST would
    // double-send to everyone (e.g. on Vercel function timeout retry).
    const alreadySent = await loadAlreadySentPhones(supabase, campaign_id);
    const queue = recipients.filter((r) => !alreadySent.has(r.phone));

    const { sentCount, failedCount, firstError } = await sendCampaignBatch(
      supabase,
      campaign!,
      queue,
    );

    // Use queue.length (not recipients.length) so retries are evaluated
    // correctly when some items were already sent.
    const actualTotal = queue.length || recipients.length;
    const finalStatus = failedCount >= actualTotal ? "failed" : "sent";
    await markCampaignDone(
      supabase,
      campaign_id,
      finalStatus,
      sentCount + alreadySent.size,
      failedCount,
    );

    return NextResponse.json({
      success: failedCount < actualTotal,
      sent_count: sentCount,
      failed_count: failedCount,
      total: recipients.length,
      error: failedCount > 0 ? firstError : undefined,
    });
  } catch (error) {
    log.error("sms_send_error", error);
    await recoverStuckCampaign(request);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
