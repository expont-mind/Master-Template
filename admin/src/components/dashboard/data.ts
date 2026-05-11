import { createAdminClient } from "@/lib/supabase/server";
import {
  parseMonthRange,
  parseDateRange,
  getUBTodayStartISO,
  getUBDayStart,
} from "@/lib/utils/date-range";
import type {
  DashboardStats,
  RecentOrder,
  TodayOrder,
  DailyRevenue,
  TopSellingProduct,
} from "./types";

// --- Main dashboard data fetcher ---

export async function getDashboardStats(
  monthFilter: string | null,
  dateRangeFilter: { from: string; to: string } | null,
): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const range = monthFilter
    ? parseMonthRange(monthFilter)
    : dateRangeFilter
      ? parseDateRange(dateRangeFilter.from, dateRangeFilter.to)
      : null;

  const todayISO = getUBTodayStartISO();

  // Default range for revenue chart: last 30 days up to end of today (UB)
  const ubTodayStart = getUBDayStart();
  const revenueRange = range || {
    from: new Date(ubTodayStart.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(ubTodayStart.getTime() + 24 * 60 * 60 * 1000),
  };

  // Apply date range filter to a query builder
  function withDateRange<
    T extends {
      gte: (col: string, val: string) => T;
      lt: (col: string, val: string) => T;
    },
  >(query: T): T {
    if (!range) return query;
    return query
      .gte("created_at", range.from.toISOString())
      .lt("created_at", range.to.toISOString());
  }

  const [
    productsResult,
    totalOrdersResult,
    pendingOrdersResult,
    usersResult,
    totalRevenueResult,
    recentOrdersResult,
    todayOrdersResult,
    todayUsersResult,
    sentSmsResult,
    smsBalanceResult,
    revenueByDayResult,
    topProductsResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    withDateRange(
      supabase.from("orders").select("id", { count: "exact", head: true }),
    ),
    withDateRange(
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    withDateRange(
      supabase.from("users").select("id", { count: "exact", head: true }),
    ),
    // RPC: total revenue (single query instead of batched pagination).
    // The typed Args parameter resolves to `undefined` due to TS
    // instantiation depth on the Functions union; cast at the boundary.
    supabase.rpc("get_total_revenue", {
      p_from: range?.from.toISOString() ?? null,
      p_to: range?.to.toISOString() ?? null,
    } as never),
    (() => {
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
    })(),
    supabase
      .from("orders")
      .select("id, total_amount, payment_status, status")
      .gte("created_at", todayISO),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    withDateRange(
      supabase
        .from("sms_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent"),
    ),
    supabase
      .from("settings")
      .select("value")
      .eq("key", "sms_balance")
      .maybeSingle(),
    // RPC: revenue by day (single query instead of batched pagination)
    supabase.rpc("get_revenue_by_day", {
      p_from: revenueRange.from.toISOString(),
      p_to: revenueRange.to.toISOString(),
    } as never),
    // RPC: top selling products (single query instead of batched pagination)
    supabase.rpc("get_top_selling_products", {
      p_from: range?.from.toISOString() ?? null,
      p_to: range?.to.toISOString() ?? null,
      p_limit: 10,
    } as never),
  ]);

  // Parse total revenue
  const totalRevenue = Number(totalRevenueResult.data) || 0;

  // Parse revenue by day + fill missing days
  const revenueRows = (revenueByDayResult.data || []) as {
    day: string;
    revenue: number;
  }[];
  const byDay = new Map<string, number>();
  for (const row of revenueRows) {
    byDay.set(row.day, Number(row.revenue));
  }
  const todayUB = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
  });
  const revenueByDay: DailyRevenue[] = [];
  const cursor = new Date(revenueRange.from);
  while (true) {
    const key = cursor.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ulaanbaatar",
    });
    revenueByDay.push({ date: key, revenue: byDay.get(key) || 0 });
    if (key >= todayUB) break;
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  // Parse top products + fetch images for the returned product IDs
  const topRows = (topProductsResult.data || []) as {
    product_id: string;
    product_name: string;
    units_sold: number;
    revenue: number;
  }[];
  let topProducts: TopSellingProduct[] = [];
  if (topRows.length > 0) {
    const productIds = topRows.map((r) => r.product_id);
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, url, is_primary")
      .in("product_id", productIds);
    const imageMap = new Map<string, string>();
    for (const img of (images || []) as {
      product_id: string;
      url: string;
      is_primary: boolean;
    }[]) {
      if (img.is_primary || !imageMap.has(img.product_id)) {
        imageMap.set(img.product_id, img.url);
      }
    }
    topProducts = topRows.map((r) => ({
      productId: r.product_id,
      name: r.product_name,
      imageUrl: imageMap.get(r.product_id) || null,
      unitsSold: Number(r.units_sold),
      revenue: Number(r.revenue),
    }));
  }

  const recentOrders = (recentOrdersResult.data || []) as RecentOrder[];
  const todayOrders = (todayOrdersResult.data || []) as TodayOrder[];
  const todayPaidOrders = todayOrders.filter(
    (o) => o.payment_status === "paid" && o.status !== "canceled",
  );
  const todayRevenue = todayPaidOrders.reduce(
    (sum, o) => sum + Number(o.total_amount),
    0,
  );

  const SMS_COST_PER_MESSAGE = 55;
  const sentSmsCount = sentSmsResult.count || 0;
  const smsBalanceRow = smsBalanceResult.data as { value: unknown } | null;
  const smsBalanceVal = smsBalanceRow?.value as { amount?: number } | null;
  const smsBalance = smsBalanceVal?.amount ?? 0;

  return {
    totalProducts: productsResult.count || 0,
    totalOrders: totalOrdersResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalRevenue,
    pendingOrders: pendingOrdersResult.count || 0,
    recentOrders,
    todayOrdersCount: todayPaidOrders.length,
    todayRevenue,
    todayNewUsers: todayUsersResult.count || 0,
    sentSmsCount,
    smsTotalCost: sentSmsCount * SMS_COST_PER_MESSAGE,
    smsBalance,
    isFiltered: !!range,
    revenueByDay,
    topProducts,
  };
}
