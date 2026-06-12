import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
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

async function fetchAllPaginated<T>(
  queryBuilder: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }> & {
    range: (
      from: number,
      to: number,
    ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
  },
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

type AdminClient = ReturnType<typeof createAdminClient>;

function countManualPhones(phones: string[]): number {
  const cleaned = phones.filter((p) => p.trim().length > 0);
  const unique = new Set(cleaned.map((p) => p.replace(/\D/g, "").replace(LOCALE.phoneRegex, "")));
  return unique.size;
}

async function countUsersWithOrders(
  supabase: AdminClient,
  filter: RecipientFilter,
): Promise<number> {
  const users = await fetchAllPaginated<{ id: string }>(() => {
    let q = supabase.from("users").select("id").not("primary_phone", "is", null);
    if (filter.user_status) q = q.eq("status", filter.user_status);
    if (filter.registered_after) {
      q = q.gte("created_at", filter.registered_after);
    }
    if (filter.registered_before) {
      q = q.lte("created_at", filter.registered_before);
    }
    return q;
  });
  if (users.length === 0) return 0;
  const userIdSet = new Set(users.map((u) => u.id));
  const orderRows = await fetchAllPaginated<{ user_id: string }>(() =>
    supabase.from("orders").select("user_id").not("user_id", "is", null),
  );
  const uniqueOrderUserIds = new Set(
    orderRows.map((o) => o.user_id).filter((id) => userIdSet.has(id)),
  );
  return uniqueOrderUserIds.size;
}

async function countAllOrFilter(
  supabase: AdminClient,
  filter: RecipientFilter,
): Promise<{ count: number } | { error: string }> {
  let query = supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .not("primary_phone", "is", null);
  if (filter.type === "filter") {
    if (filter.user_status) query = query.eq("status", filter.user_status);
    if (filter.registered_after) {
      query = query.gte("created_at", filter.registered_after);
    }
    if (filter.registered_before) {
      query = query.lte("created_at", filter.registered_before);
    }
  }
  const { count, error } = await query;
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

export async function POST(request: NextRequest) {
  try {
    const { recipient_filter } = (await request.json()) as {
      recipient_filter: RecipientFilter;
    };

    if (!recipient_filter) {
      return NextResponse.json({ error: "recipient_filter is required" }, { status: 400 });
    }

    if (recipient_filter.type === "manual") {
      return NextResponse.json({
        count: countManualPhones(recipient_filter.phones ?? []),
      });
    }

    const supabase = createAdminClient();

    if (recipient_filter.type === "filter" && recipient_filter.has_orders) {
      const count = await countUsersWithOrders(supabase, recipient_filter);
      return NextResponse.json({ count });
    }

    const result = await countAllOrFilter(supabase, recipient_filter);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ count: result.count });
  } catch (error) {
    log.error("sms_preview_error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
