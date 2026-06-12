"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import {
  buildCategoryBreakdown,
  buildRevenueByDay,
  computeOrderBreakdowns,
  computeSalesMetrics,
  partitionSalesOrders,
} from "./_salesTabAggregators";

import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { OrderRow, CategoryRow, HeatmapCell } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useSalesTab(dr: AnalyticsDateRange, isActive: boolean) {
  const dateFilters = useMemo(
    () =>
      dr.isAllTime ? undefined : { "created_at.gte": dr.prevFromIso, "created_at.lt": dr.toIso },
    [dr.isAllTime, dr.prevFromIso, dr.toIso],
  );

  const ordersQuery = useQuery({
    queryKey: [
      ...queryKeys.analytics.sales(dr.fromIso, dr.toIso),
      "orders",
      dr.prevFromIso,
      dr.isAllTime,
    ],
    queryFn: () =>
      adminApi.getAllBatched<OrderRow>("orders", {
        select: "id,total_amount,status,delivery_status,payment_status,payment_method,created_at",
        filters: dateFilters,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  // Order items with product category info for category breakdown
  const orderItemsQuery = useQuery({
    queryKey: [...queryKeys.analytics.sales(dr.fromIso, dr.toIso), "order_items"],
    queryFn: () =>
      adminApi.getAllBatched<{
        order_id: string;
        product_id: string;
        quantity: number;
        price: number;
        products: { category_id: string | null } | null;
      }>("order_items", {
        select: "order_id,product_id,quantity,price,products(category_id)",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.analytics.sales(dr.fromIso, dr.toIso), "categories"],
    queryFn: () => adminApi.getAllBatched<CategoryRow>("categories", { select: "id,name" }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const heatmapQuery = useQuery({
    queryKey: queryKeys.analytics.salesHeatmap(dr.fromIso, dr.toIso),
    queryFn: () =>
      adminApi.rpc<HeatmapCell[]>("get_order_heatmap", {
        p_date_from: dr.fromIso,
        p_date_to: dr.toIso,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = ordersQuery.isLoading || orderItemsQuery.isLoading || categoriesQuery.isLoading;

  const data = useMemo(() => {
    const allOrders = ordersQuery.data ?? [];
    const allOrderItems = orderItemsQuery.data ?? [];
    const allCategories = categoriesQuery.data ?? [];

    const partition = partitionSalesOrders(allOrders, dr.from, dr.isAllTime);
    const metrics = computeSalesMetrics(partition);
    const revenueByDay = buildRevenueByDay(partition.revenueOrders, dr.periodDays);
    const breakdowns = computeOrderBreakdowns(partition.periodOrders);
    const revenueOrderIds = new Set(partition.revenueOrders.map((o) => o.id));
    const categoryBreakdown = buildCategoryBreakdown(allOrderItems, allCategories, revenueOrderIds);

    return {
      ...metrics,
      revenueByDay,
      ...breakdowns,
      categoryBreakdown,
    };
  }, [
    ordersQuery.data,
    orderItemsQuery.data,
    categoriesQuery.data,
    dr.from,
    dr.isAllTime,
    dr.periodDays,
  ]);

  return {
    ...data,
    heatmapData: heatmapQuery.data ?? [],
    heatmapLoading: heatmapQuery.isLoading,
    isLoading,
  };
}
