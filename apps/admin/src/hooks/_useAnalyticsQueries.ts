"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type {
  CategoryRow,
  OrderItemRow,
  OrderRow,
  ProductRow,
  ReviewRow,
  UserRow,
} from "@/components/analytics/business/types";

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

interface QueryParams {
  fromIso: string;
  toIso: string;
  prevFromIso: string;
  isAllTime: boolean;
  dateFilters: Record<string, string> | undefined;
}

/**
 * Fan out the six analytics queries (orders, users, order items, products,
 * reviews, categories) with consistent query key + stale time. Keeps the
 * fetch fan-out out of useAnalyticsData so the hook stays focused on
 * derivations.
 */
export function useAnalyticsQueries({
  fromIso,
  toIso,
  prevFromIso,
  isAllTime,
  dateFilters,
}: QueryParams) {
  const ordersQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "orders", prevFromIso, isAllTime],
    queryFn: () =>
      adminApi.getAllBatched<OrderRow>("orders", {
        select: "id,total_amount,status,delivery_status,payment_status,payment_method,created_at",
        filters: dateFilters,
      }),
    ...QUERY_CONFIG,
  });

  const usersQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "users", prevFromIso, isAllTime],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<UserRow>("users", {
        select: "id,status,created_at",
        filters: dateFilters,
      }),
    ...QUERY_CONFIG,
  });

  // Switched from getAll(limit:10000) to getAllBatched with a hard cap
  // because the API route now enforces a 500-row per-request limit; the
  // previous call would have been silently truncated.
  const orderItemsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "order_items"],
    queryFn: () =>
      adminApi.getAllBatched<OrderItemRow>("order_items", {
        select:
          "order_id,product_id,quantity,price,products(id,name,price,category_id,brand_id,status,product_images(url,is_primary))",
      }),
    ...QUERY_CONFIG,
  });

  const productsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "products"],
    queryFn: () =>
      adminApi.getAllBatched<ProductRow>("products", {
        select:
          "id,name,price,discount_price,stock_quantity,status,category_id,brand_id,created_at,product_variants(id,stock_quantity)",
      }),
    ...QUERY_CONFIG,
  });

  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "reviews"],
    queryFn: () =>
      adminApi.getAllBatched<ReviewRow>("reviews", {
        select: "product_id,rating,status",
        filters: { "status.eq": "active" },
      }),
    ...QUERY_CONFIG,
  });

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "categories"],
    queryFn: () =>
      adminApi.getAllBatched<CategoryRow>("categories", {
        select: "id,name",
      }),
    ...QUERY_CONFIG,
  });

  const isLoading =
    ordersQuery.isLoading ||
    usersQuery.isLoading ||
    orderItemsQuery.isLoading ||
    productsQuery.isLoading ||
    reviewsQuery.isLoading ||
    categoriesQuery.isLoading;

  return {
    ordersQuery,
    usersQuery,
    orderItemsQuery,
    productsQuery,
    reviewsQuery,
    categoriesQuery,
    isLoading,
  };
}
