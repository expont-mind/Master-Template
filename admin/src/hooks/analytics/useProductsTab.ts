"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { ReviewRow } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

interface ProductBasic { id: string; name: string; status: string; category_id: string | null }

export function useProductsTab(dr: AnalyticsDateRange, isActive: boolean) {
  const productsQuery = useQuery({
    queryKey: [...queryKeys.analytics.products(dr.fromIso, dr.toIso), "products"],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<ProductBasic>("products", {
        select: "id,name,status,category_id",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.analytics.products(dr.fromIso, dr.toIso), "reviews"],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<ReviewRow>("reviews", {
        select: "product_id,rating,status",
        filters: { "status.eq": "active" },
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = productsQuery.isLoading || reviewsQuery.isLoading;

  const data = useMemo(() => {
    const productsResult = productsQuery.data;
    const reviewsResult = reviewsQuery.data;
    const allProducts = productsResult?.data ?? [];
    const allReviews = reviewsResult?.data ?? [];

    const activeProducts = allProducts.filter((p) => p.status === "active").length;
    const totalProducts = productsResult?.totalCount ?? allProducts.length;

    let ratingSum = 0;
    let ratingCount = 0;
    for (const r of allReviews) {
      ratingSum += r.rating;
      ratingCount++;
    }
    const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
    const totalReviews = reviewsResult?.totalCount ?? ratingCount;

    return {
      totalProducts,
      activeProducts,
      avgRating,
      totalReviews,
    };
  }, [productsQuery.data, reviewsQuery.data]);

  return { ...data, isLoading };
}
