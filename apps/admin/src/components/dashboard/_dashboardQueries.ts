// Supabase query builders used by getDashboardStats. Each fetcher returns
// the raw Supabase result. Composition + Promise.all lives in data.ts.

import type { createAdminClient } from "@/lib/supabase/server";

interface DateRange {
  from: Date;
  to: Date;
}

type Admin = ReturnType<typeof createAdminClient>;

function applyDateRange<
  T extends {
    gte: (col: string, val: string) => T;
    lt: (col: string, val: string) => T;
  },
>(query: T, range: DateRange | null): T {
  if (!range) return query;
  return query.gte("created_at", range.from.toISOString()).lt("created_at", range.to.toISOString());
}

export function fetchProductsCount(supabase: Admin) {
  return supabase.from("products").select("id", { count: "exact", head: true });
}

export function fetchTotalOrdersCount(supabase: Admin, range: DateRange | null) {
  return applyDateRange(
    supabase.from("orders").select("id", { count: "exact", head: true }),
    range,
  );
}

export function fetchPendingOrdersCount(supabase: Admin, range: DateRange | null) {
  return applyDateRange(
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    range,
  );
}

export function fetchUsersCount(supabase: Admin, range: DateRange | null) {
  return applyDateRange(supabase.from("users").select("id", { count: "exact", head: true }), range);
}

export function fetchTotalRevenue(supabase: Admin, range: DateRange | null) {
  return supabase.rpc("get_total_revenue", {
    p_from: range?.from.toISOString() ?? null,
    p_to: range?.to.toISOString() ?? null,
  } as never);
}

export function fetchRecentOrders(supabase: Admin, range: DateRange | null) {
  let q = supabase
    .from("orders")
    .select(
      `
        id, status, payment_status, total_amount, created_at,
        users (first_name, last_name, email),
        order_items (
          id, quantity,
          products (name, product_images (url, is_primary))
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(5);
  if (range) {
    q = q.gte("created_at", range.from).lt("created_at", range.to);
  }
  return q;
}

export function fetchTodayOrders(supabase: Admin, todayISO: string) {
  return supabase
    .from("orders")
    .select("id, total_amount, payment_status, status")
    .gte("created_at", todayISO);
}

export function fetchTodayUsersCount(supabase: Admin, todayISO: string) {
  return supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayISO);
}

export function fetchSentSmsCount(supabase: Admin, range: DateRange | null) {
  return applyDateRange(
    supabase.from("sms_logs").select("id", { count: "exact", head: true }).eq("status", "sent"),
    range,
  );
}

export function fetchSmsBalance(supabase: Admin) {
  return supabase.from("settings").select("value").eq("key", "sms_balance").maybeSingle();
}

export function fetchRevenueByDay(supabase: Admin, revenueRange: DateRange) {
  return supabase.rpc("get_revenue_by_day", {
    p_from: revenueRange.from.toISOString(),
    p_to: revenueRange.to.toISOString(),
  } as never);
}

export function fetchTopProducts(supabase: Admin, range: DateRange | null) {
  return supabase.rpc("get_top_selling_products", {
    p_from: range?.from.toISOString() ?? null,
    p_to: range?.to.toISOString() ?? null,
    p_limit: 10,
  } as never);
}

export function fetchProductImagesForIds(supabase: Admin, productIds: string[]) {
  return supabase
    .from("product_images")
    .select("product_id, url, is_primary")
    .in("product_id", productIds);
}

interface TopRow {
  product_id: string;
}
interface ImageRow {
  product_id: string;
  url: string;
  is_primary: boolean;
}

export async function fetchImagesForTopProducts(
  supabase: Admin,
  topRows: TopRow[],
): Promise<ImageRow[]> {
  if (topRows.length === 0) return [];
  const { data } = await fetchProductImagesForIds(
    supabase,
    topRows.map((r) => r.product_id),
  );
  return (data || []) as ImageRow[];
}
