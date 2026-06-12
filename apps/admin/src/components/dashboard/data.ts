import { createAdminClient } from "@/lib/supabase/server";
import { parseMonthRange, parseDateRange, getUBTodayStartISO } from "@/lib/utils/date-range";

import {
  asRevenueRows,
  asTopRows,
  buildCounts,
  buildRevenueByDay,
  buildTopProducts,
  computeSmsStats,
  computeTodayTotals,
  getRevenueRange,
} from "./_dashboardAggregators";
import {
  fetchImagesForTopProducts,
  fetchPendingOrdersCount,
  fetchProductsCount,
  fetchRecentOrders,
  fetchRevenueByDay,
  fetchSentSmsCount,
  fetchSmsBalance,
  fetchTodayOrders,
  fetchTodayUsersCount,
  fetchTopProducts,
  fetchTotalOrdersCount,
  fetchTotalRevenue,
  fetchUsersCount,
} from "./_dashboardQueries";

import type { DashboardStats, RecentOrder, TodayOrder } from "./types";

function resolveRange(
  monthFilter: string | null,
  dateRangeFilter: { from: string; to: string } | null,
) {
  if (monthFilter) return parseMonthRange(monthFilter);
  if (dateRangeFilter) return parseDateRange(dateRangeFilter.from, dateRangeFilter.to);
  return null;
}

export async function getDashboardStats(
  monthFilter: string | null,
  dateRangeFilter: { from: string; to: string } | null,
): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const range = resolveRange(monthFilter, dateRangeFilter);
  const todayISO = getUBTodayStartISO();
  const revenueRange = getRevenueRange(range);

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
    fetchProductsCount(supabase),
    fetchTotalOrdersCount(supabase, range),
    fetchPendingOrdersCount(supabase, range),
    fetchUsersCount(supabase, range),
    fetchTotalRevenue(supabase, range),
    fetchRecentOrders(supabase, range),
    fetchTodayOrders(supabase, todayISO),
    fetchTodayUsersCount(supabase, todayISO),
    fetchSentSmsCount(supabase, range),
    fetchSmsBalance(supabase),
    fetchRevenueByDay(supabase, revenueRange),
    fetchTopProducts(supabase, range),
  ]);

  const revenueByDay = buildRevenueByDay(asRevenueRows(revenueByDayResult.data), revenueRange);

  const topRows = asTopRows(topProductsResult.data);
  const imageRows = await fetchImagesForTopProducts(supabase, topRows);
  const topProducts = buildTopProducts(topRows, imageRows);

  const recentOrders = (recentOrdersResult.data || []) as RecentOrder[];
  const todayOrders = (todayOrdersResult.data || []) as TodayOrder[];
  const { count: todayOrdersCount, revenue: todayRevenue } = computeTodayTotals(todayOrders);

  const smsBalanceRow = smsBalanceResult.data as { value: unknown } | null;
  const { sentSmsCount, smsTotalCost, smsBalance } = computeSmsStats(
    sentSmsResult.count ?? 0,
    smsBalanceRow,
  );

  const counts = buildCounts({
    productsResult,
    totalOrdersResult,
    pendingOrdersResult,
    usersResult,
    todayUsersResult,
  });

  return {
    ...counts,
    totalRevenue: Number(totalRevenueResult.data) || 0,
    recentOrders,
    todayOrdersCount,
    todayRevenue,
    sentSmsCount,
    smsTotalCost,
    smsBalance,
    isFiltered: !!range,
    revenueByDay,
    topProducts,
  };
}
