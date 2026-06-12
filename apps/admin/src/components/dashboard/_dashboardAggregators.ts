// Pure aggregator helpers for getDashboardStats. Each function takes raw
// results from Supabase and returns a typed slice. No IO, no Supabase calls.

import { getUBDayStart } from "@/lib/utils/date-range";

import type { DailyRevenue, TopSellingProduct, TodayOrder } from "./types";

interface DateRange {
  from: Date;
  to: Date;
}

interface RevenueRow {
  day: string;
  revenue: number;
}

interface TopRow {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
}

interface ImageRow {
  product_id: string;
  url: string;
  is_primary: boolean;
}

export function buildRevenueByDay(rows: RevenueRow[], revenueRange: DateRange): DailyRevenue[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    byDay.set(row.day, Number(row.revenue));
  }
  const todayUB = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
  });
  const result: DailyRevenue[] = [];
  const cursor = new Date(revenueRange.from);
  while (true) {
    const key = cursor.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ulaanbaatar",
    });
    result.push({ date: key, revenue: byDay.get(key) || 0 });
    if (key >= todayUB) break;
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return result;
}

export function buildTopProducts(
  topRows: TopRow[],
  images: ImageRow[] | null,
): TopSellingProduct[] {
  if (topRows.length === 0) return [];
  const imageMap = new Map<string, string>();
  for (const img of images || []) {
    if (img.is_primary || !imageMap.has(img.product_id)) {
      imageMap.set(img.product_id, img.url);
    }
  }
  return topRows.map((r) => ({
    productId: r.product_id,
    name: r.product_name,
    imageUrl: imageMap.get(r.product_id) || null,
    unitsSold: Number(r.units_sold),
    revenue: Number(r.revenue),
  }));
}

export function computeTodayTotals(todayOrders: TodayOrder[]): {
  count: number;
  revenue: number;
} {
  const paid = todayOrders.filter((o) => o.payment_status === "paid" && o.status !== "canceled");
  const revenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);
  return { count: paid.length, revenue };
}

const SMS_COST_PER_MESSAGE = 55;

export function computeSmsStats(
  sentSmsCount: number,
  smsBalanceRow: { value: unknown } | null,
): { sentSmsCount: number; smsTotalCost: number; smsBalance: number } {
  const smsBalanceVal = smsBalanceRow?.value as { amount?: number } | null;
  return {
    sentSmsCount,
    smsTotalCost: sentSmsCount * SMS_COST_PER_MESSAGE,
    smsBalance: smsBalanceVal?.amount ?? 0,
  };
}

export function getRevenueRange(range: DateRange | null): DateRange {
  if (range) return range;
  // Default range for revenue chart: last 30 days up to end of today (UB)
  const ubTodayStart = getUBDayStart();
  return {
    from: new Date(ubTodayStart.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(ubTodayStart.getTime() + 24 * 60 * 60 * 1000),
  };
}

export function asRevenueRows(data: unknown): RevenueRow[] {
  return (data || []) as RevenueRow[];
}

export function asTopRows(data: unknown): TopRow[] {
  return (data || []) as TopRow[];
}

export function asImageRows(data: unknown): ImageRow[] {
  return (data || []) as ImageRow[];
}

export type { ImageRow, RevenueRow, TopRow };

interface CountedResult {
  count: number | null;
}

export function buildCounts(args: {
  productsResult: CountedResult;
  totalOrdersResult: CountedResult;
  pendingOrdersResult: CountedResult;
  usersResult: CountedResult;
  todayUsersResult: CountedResult;
}): {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  todayNewUsers: number;
} {
  return {
    totalProducts: args.productsResult.count ?? 0,
    totalOrders: args.totalOrdersResult.count ?? 0,
    totalUsers: args.usersResult.count ?? 0,
    pendingOrders: args.pendingOrdersResult.count ?? 0,
    todayNewUsers: args.todayUsersResult.count ?? 0,
  };
}
