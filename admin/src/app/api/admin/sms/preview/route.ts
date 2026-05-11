import { createAdminClient } from "@/lib/supabase/server";
import { LOCALE } from "@/lib/utils/brand-config";
import { log } from "@/lib/observability/log";
import { NextRequest, NextResponse } from "next/server";

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
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
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

export async function POST(request: NextRequest) {
  try {
    const { recipient_filter } = (await request.json()) as {
      recipient_filter: RecipientFilter;
    };

    if (!recipient_filter) {
      return NextResponse.json({ error: "recipient_filter is required" }, { status: 400 });
    }

    if (recipient_filter.type === "manual") {
      const phones = (recipient_filter.phones ?? []).filter((p) => p.trim().length > 0);
      // Deduplicate by normalized phone number
      const unique = new Set(
        phones.map((p) => p.replace(/\D/g, "").replace(LOCALE.phoneRegex, ""))
      );
      return NextResponse.json({ count: unique.size });
    }

    const supabase = createAdminClient();

    // If has_orders filter, need to fetch actual data and cross-reference
    if (recipient_filter.type === "filter" && recipient_filter.has_orders) {
      const users = await fetchAllPaginated<{ id: string }>(() => {
        let q = supabase
          .from("users")
          .select("id")
          .not("primary_phone", "is", null);

        if (recipient_filter.user_status) {
          q = q.eq("status", recipient_filter.user_status);
        }
        if (recipient_filter.registered_after) {
          q = q.gte("created_at", recipient_filter.registered_after);
        }
        if (recipient_filter.registered_before) {
          q = q.lte("created_at", recipient_filter.registered_before);
        }
        return q;
      });

      if (users.length === 0) {
        return NextResponse.json({ count: 0 });
      }

      const userIdSet = new Set(users.map((u) => u.id));

      const orderRows = await fetchAllPaginated<{ user_id: string }>(() =>
        supabase.from("orders").select("user_id").not("user_id", "is", null)
      );

      const uniqueOrderUserIds = new Set(
        orderRows
          .map((o) => o.user_id)
          .filter((id) => userIdSet.has(id))
      );

      return NextResponse.json({ count: uniqueOrderUserIds.size });
    }

    // For all/filter without has_orders: use efficient count
    let query = supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .not("primary_phone", "is", null);

    if (recipient_filter.type === "filter") {
      if (recipient_filter.user_status) {
        query = query.eq("status", recipient_filter.user_status);
      }
      if (recipient_filter.registered_after) {
        query = query.gte("created_at", recipient_filter.registered_after);
      }
      if (recipient_filter.registered_before) {
        query = query.lte("created_at", recipient_filter.registered_before);
      }
    }

    const { count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    log.error("sms_preview_error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
