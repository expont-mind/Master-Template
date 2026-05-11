"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { aggregateByDay } from "@/hooks/useAnalyticsData";
import { parseAsUTC } from "@/lib/utils/formatters";
import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { OrderRow, UserRow, OrderItemRow, DayValue } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useOverviewTab(dr: AnalyticsDateRange, isActive: boolean) {
  const dateFilters = useMemo(
    () => dr.isAllTime ? undefined : { "created_at.gte": dr.prevFromIso, "created_at.lt": dr.toIso },
    [dr.isAllTime, dr.prevFromIso, dr.toIso],
  );

  const ordersQuery = useQuery({
    queryKey: [...queryKeys.analytics.overview(dr.fromIso, dr.toIso), "orders", dr.prevFromIso, dr.isAllTime],
    queryFn: () =>
      adminApi.getAllBatched<OrderRow>("orders", {
        select: "id,total_amount,status,delivery_status,payment_status,payment_method,created_at",
        filters: dateFilters,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const usersQuery = useQuery({
    queryKey: [...queryKeys.analytics.overview(dr.fromIso, dr.toIso), "users", dr.prevFromIso, dr.isAllTime],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<UserRow>("users", {
        select: "id,status,created_at",
        filters: dateFilters,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const orderItemsQuery = useQuery({
    queryKey: [...queryKeys.analytics.overview(dr.fromIso, dr.toIso), "order_items"],
    queryFn: () =>
      adminApi.getAllBatched<OrderItemRow>("order_items", {
        select: "order_id,product_id,quantity,price,products(id,name,price,category_id,brand_id,status,product_images(url,is_primary))",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = ordersQuery.isLoading || usersQuery.isLoading || orderItemsQuery.isLoading;

  const data = useMemo(() => {
    const allOrders = ordersQuery.data ?? [];
    const usersResult = usersQuery.data;
    const allUsers = usersResult?.data ?? [];
    const allOrderItems = orderItemsQuery.data ?? [];

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
    const totalOrders = periodOrders.length;
    const prevOrders = prevPeriodOrders.length;
    const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    const periodUsers = dr.isAllTime
      ? allUsers
      : allUsers.filter((u) => new Date(u.created_at) >= dr.from);
    const prevPeriodUsers = dr.isAllTime
      ? []
      : allUsers.filter((u) => new Date(u.created_at) < dr.from);
    const newUsers = periodUsers.length;
    const prevNewUsers = prevPeriodUsers.length;

    const revenueByDay: DayValue[] = aggregateByDay(
      revenueOrders.map((o) => ({ created_at: o.created_at, value: o.total_amount || 0 })),
      dr.periodDays,
    );
    const ordersByDay: DayValue[] = aggregateByDay(
      periodOrders.map((o) => ({ created_at: o.created_at, value: 1 })),
      dr.periodDays,
    );
    const usersByDay: DayValue[] = aggregateByDay(
      periodUsers.map((u) => ({ created_at: u.created_at, value: 1 })),
      dr.periodDays,
    );

    // Top 5 products by revenue
    const paidOrderIds = new Set(revenueOrders.map((o) => o.id));
    const productRevMap = new Map<string, { name: string; revenue: number }>();
    for (const item of allOrderItems) {
      if (!paidOrderIds.has(item.order_id) || !item.products) continue;
      const existing = productRevMap.get(item.product_id);
      const rev = item.quantity * item.price;
      if (existing) {
        existing.revenue += rev;
      } else {
        productRevMap.set(item.product_id, { name: item.products.name, revenue: rev });
      }
    }
    const topProducts = Array.from(productRevMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      prevRevenue,
      totalOrders,
      prevOrders,
      newUsers,
      prevNewUsers,
      averageOrderValue,
      revenueByDay,
      ordersByDay,
      usersByDay,
      topProducts,
    };
  }, [ordersQuery.data, usersQuery.data, orderItemsQuery.data, dr.from, dr.isAllTime, dr.periodDays]);

  return { ...data, isLoading };
}
