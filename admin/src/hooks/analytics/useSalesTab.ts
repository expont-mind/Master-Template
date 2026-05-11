"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { aggregateByDay } from "@/hooks/useAnalyticsData";
import { parseAsUTC } from "@/lib/utils/formatters";
import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { OrderRow, CategoryRow, HeatmapCell, DayValue } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useSalesTab(dr: AnalyticsDateRange, isActive: boolean) {
  const dateFilters = useMemo(
    () => dr.isAllTime ? undefined : { "created_at.gte": dr.prevFromIso, "created_at.lt": dr.toIso },
    [dr.isAllTime, dr.prevFromIso, dr.toIso],
  );

  const ordersQuery = useQuery({
    queryKey: [...queryKeys.analytics.sales(dr.fromIso, dr.toIso), "orders", dr.prevFromIso, dr.isAllTime],
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
      adminApi.getAllBatched<{ order_id: string; product_id: string; quantity: number; price: number; products: { category_id: string | null } | null }>("order_items", {
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

    const periodOrders = dr.isAllTime
      ? allOrders
      : allOrders.filter((o) => parseAsUTC(o.created_at) >= dr.from);
    const prevPeriodOrders = dr.isAllTime
      ? []
      : allOrders.filter((o) => parseAsUTC(o.created_at) < dr.from);

    const revenueOrders = periodOrders.filter(
      (o) => o.status !== "canceled" && o.payment_status === "paid",
    );
    const prevRevenueOrders = prevPeriodOrders.filter(
      (o) => o.status !== "canceled" && o.payment_status === "paid",
    );

    const totalRevenue = revenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const prevRevenue = prevRevenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const paidOrders = revenueOrders.length;
    const prevPaidOrders = prevRevenueOrders.length;
    const totalOrders = periodOrders.length;
    const canceledOrders = periodOrders.filter((o) => o.status === "canceled").length;
    const cancellationRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
    const prevAov = prevPaidOrders > 0 ? prevRevenue / prevPaidOrders : 0;

    const revenueByDay: DayValue[] = aggregateByDay(
      revenueOrders.map((o) => ({ created_at: o.created_at, value: o.total_amount || 0 })),
      dr.periodDays,
    );

    // Order status funnel
    const ordersByStatus: Record<string, number> = {};
    for (const o of periodOrders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    // Delivery funnel
    const deliveryFunnel: Record<string, number> = {};
    for (const o of periodOrders) {
      if (o.delivery_status) {
        deliveryFunnel[o.delivery_status] = (deliveryFunnel[o.delivery_status] ?? 0) + 1;
      }
    }

    // Payment method breakdown
    const nonCanceledOrders = periodOrders.filter((o) => o.status !== "canceled");
    const paymentMethodBreakdown: Record<string, number> = {};
    for (const o of nonCanceledOrders) {
      if (o.payment_method) {
        paymentMethodBreakdown[o.payment_method] = (paymentMethodBreakdown[o.payment_method] ?? 0) + 1;
      }
    }

    // Category breakdown from order items
    const categoryMap = new Map<string, string>();
    for (const c of allCategories) categoryMap.set(c.id, c.name);

    const paidOrderIds = new Set(revenueOrders.map((o) => o.id));
    const categoryRevMap = new Map<string, number>();
    for (const item of allOrderItems) {
      if (!paidOrderIds.has(item.order_id) || !item.products?.category_id) continue;
      const catName = categoryMap.get(item.products.category_id) ?? "Бусад";
      categoryRevMap.set(catName, (categoryRevMap.get(catName) ?? 0) + item.quantity * item.price);
    }
    const categoryBreakdown = Array.from(categoryRevMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      prevRevenue,
      paidOrders,
      prevPaidOrders,
      cancellationRate,
      averageOrderValue,
      prevAov,
      totalOrders,
      revenueByDay,
      ordersByStatus,
      deliveryFunnel,
      paymentMethodBreakdown,
      categoryBreakdown,
    };
  }, [ordersQuery.data, orderItemsQuery.data, categoriesQuery.data, dr.from, dr.isAllTime, dr.periodDays]);

  return { ...data, heatmapData: heatmapQuery.data ?? [], heatmapLoading: heatmapQuery.isLoading, isLoading };
}
