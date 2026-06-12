"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import {
  buildOverviewDayBuckets,
  buildTopProducts,
  computeOverviewOrderMetrics,
  partitionOverviewOrders,
  partitionOverviewUsers,
} from "./_overviewTabAggregators";

import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { OrderRow, UserRow, OrderItemRow } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useOverviewTab(dr: AnalyticsDateRange, isActive: boolean) {
  const dateFilters = useMemo(
    () =>
      dr.isAllTime ? undefined : { "created_at.gte": dr.prevFromIso, "created_at.lt": dr.toIso },
    [dr.isAllTime, dr.prevFromIso, dr.toIso],
  );

  const ordersQuery = useQuery({
    queryKey: [
      ...queryKeys.analytics.overview(dr.fromIso, dr.toIso),
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

  const usersQuery = useQuery({
    queryKey: [
      ...queryKeys.analytics.overview(dr.fromIso, dr.toIso),
      "users",
      dr.prevFromIso,
      dr.isAllTime,
    ],
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
        select:
          "order_id,product_id,quantity,price,products(id,name,price,category_id,brand_id,status,product_images(url,is_primary))",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = ordersQuery.isLoading || usersQuery.isLoading || orderItemsQuery.isLoading;

  const data = useMemo(() => {
    const allOrders = ordersQuery.data ?? [];
    const allUsers = usersQuery.data?.data ?? [];
    const allOrderItems = orderItemsQuery.data ?? [];

    const orderPartition = partitionOverviewOrders(allOrders, dr.from, dr.isAllTime);
    const orderMetrics = computeOverviewOrderMetrics(orderPartition);
    const userPartition = partitionOverviewUsers(allUsers, dr.from, dr.isAllTime);
    const dayBuckets = buildOverviewDayBuckets(
      orderPartition.revenueOrders,
      orderPartition.periodOrders,
      userPartition.periodUsers,
      dr.periodDays,
    );
    const topProducts = buildTopProducts(allOrderItems, orderPartition.revenueOrders);

    return {
      ...orderMetrics,
      newUsers: userPartition.periodUsers.length,
      prevNewUsers: userPartition.prevPeriodUsers.length,
      ...dayBuckets,
      topProducts,
    };
  }, [
    ordersQuery.data,
    usersQuery.data,
    orderItemsQuery.data,
    dr.from,
    dr.isAllTime,
    dr.periodDays,
  ]);

  return { ...data, isLoading };
}
