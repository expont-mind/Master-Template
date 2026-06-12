"use client";

import { useCallback, useMemo, useState } from "react";

import { parseMonthRange, getCurrentMonth } from "@/lib/utils/date-range";

import {
  aggregateByDay,
  buildCategoryBreakdown,
  buildInventoryAlerts,
  buildProductPerformance,
  buildProductSalesMap,
  buildReviewStats,
  computeOrderBreakdown,
  computeOrderMetrics,
  computeUserMetrics,
  partitionOrders,
} from "./_analyticsAggregators";
import { useAnalyticsQueries } from "./_useAnalyticsQueries";

import type { AnalyticsData } from "@/components/analytics/business/types";

export { aggregateByDay } from "./_analyticsAggregators";

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function useAnalyticsData() {
  const [initialMonth] = useState(() => getCurrentMonth());
  const [period, setPeriodRaw] = useState<string>(initialMonth);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    () => parseMonthRange(initialMonth)!,
  );

  const setPeriod = useCallback((value: string) => {
    setPeriodRaw(value);
    if (value === "all") {
      setDateRange({ from: new Date("2020-01-01T00:00:00Z"), to: new Date() });
      return;
    }
    const monthRange = parseMonthRange(value);
    if (monthRange) {
      setDateRange(monthRange);
    }
  }, []);

  const setCustomDateRange = useCallback((range: { from: Date; to: Date }) => {
    setPeriodRaw("custom");
    setDateRange(range);
  }, []);

  const { from, to } = dateRange;
  const periodDays = daysBetween(from, to);

  const prevFrom = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() - periodDays);
    return d;
  }, [from, periodDays]);

  const isAllTime = period === "all";
  const prevFromIso = useMemo(() => prevFrom.toISOString(), [prevFrom]);
  const fromIso = useMemo(() => from.toISOString(), [from]);
  const toIso = useMemo(() => to.toISOString(), [to]);

  const dateFilters = useMemo(
    () => (isAllTime ? undefined : { "created_at.gte": prevFromIso, "created_at.lt": toIso }),
    [isAllTime, prevFromIso, toIso],
  );

  const queries = useAnalyticsQueries({
    fromIso,
    toIso,
    prevFromIso,
    isAllTime,
    dateFilters,
  });

  const data = useMemo<AnalyticsData>(() => {
    const allOrders = queries.ordersQuery.data ?? [];
    const usersResult = queries.usersQuery.data;
    const allUsers = usersResult?.data ?? [];
    const allOrderItems = queries.orderItemsQuery.data ?? [];
    const allProducts = queries.productsQuery.data ?? [];
    const allReviews = queries.reviewsQuery.data ?? [];
    const allCategories = queries.categoriesQuery.data ?? [];

    const partition = partitionOrders(allOrders, from, isAllTime);
    const orderMetrics = computeOrderMetrics(partition);
    const orderBreakdown = computeOrderBreakdown(partition.periodOrders);
    const userMetrics = computeUserMetrics(allUsers, from, isAllTime, usersResult?.totalCount);

    const revenueByDay = aggregateByDay(
      partition.revenueOrders.map((o) => ({
        created_at: o.created_at,
        value: o.total_amount || 0,
      })),
      periodDays,
    );
    const ordersByDay = aggregateByDay(
      partition.periodOrders.map((o) => ({
        created_at: o.created_at,
        value: 1,
      })),
      periodDays,
    );
    const usersByDay = aggregateByDay(
      userMetrics.periodUsers.map((u) => ({
        created_at: u.created_at,
        value: 1,
      })),
      periodDays,
    );

    const productSalesMap = buildProductSalesMap(allOrderItems, partition.paidOrderIds);
    const reviewStats = buildReviewStats(allReviews);
    const allProductPerf = buildProductPerformance(
      allProducts,
      productSalesMap,
      reviewStats.reviewMap,
    );
    const categoryBreakdown = buildCategoryBreakdown(allProductPerf, allCategories);
    const inventoryAlerts = buildInventoryAlerts(allProducts, productSalesMap);

    return {
      ...orderMetrics,
      ...orderBreakdown,
      newUsers: userMetrics.newUsers,
      prevNewUsers: userMetrics.prevNewUsers,
      totalUsers: userMetrics.totalUsers,
      activeUsers: userMetrics.activeUsers,
      avgRating: reviewStats.avgRating,
      revenueByDay,
      ordersByDay,
      usersByDay,
      allProducts: allProductPerf,
      categoryBreakdown,
      inventoryAlerts,
      isLoading: queries.isLoading,
    };
  }, [
    queries.ordersQuery.data,
    queries.usersQuery.data,
    queries.orderItemsQuery.data,
    queries.productsQuery.data,
    queries.reviewsQuery.data,
    queries.categoriesQuery.data,
    queries.isLoading,
    from,
    periodDays,
    isAllTime,
  ]);

  return {
    ...data,
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
  };
}
