"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  reviewKeys,
  getReviews,
  getReviewSummary,
  checkCanReview,
  checkCanReviewAny,
} from "@/lib/queries/reviews";
import { CACHE_TTL } from "@/lib/utils/constants";

export function useReviews(productId: string, rating?: number | null) {
  return useInfiniteQuery({
    queryKey: reviewKeys.list(productId, rating),
    queryFn: ({ pageParam = 0 }) => getReviews(productId, pageParam, rating),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: CACHE_TTL.PRODUCT_DETAIL * 1000,
    enabled: !!productId,
  });
}

export function useReviewSummary(productId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () => getReviewSummary(productId),
    staleTime: CACHE_TTL.PRODUCT_DETAIL * 1000,
    enabled: !!productId,
  });
}

export function useCanReview(productId: string, userId: string | null) {
  return useQuery({
    queryKey: reviewKeys.canReview(productId, userId ?? ""),
    queryFn: () => checkCanReview(productId, userId!),
    staleTime: CACHE_TTL.PRODUCT_DETAIL * 1000,
    enabled: !!productId && !!userId,
  });
}

/**
 * Check if any product in an order can be reviewed.
 * Returns the first reviewable product ID, or null.
 */
export function useCanReviewAny(
  productIds: string[],
  userId: string | null,
) {
  return useQuery({
    queryKey: [
      ...reviewKeys.all,
      "canReviewAny",
      ...productIds.toSorted(),
      userId ?? "",
    ],
    queryFn: () => checkCanReviewAny(productIds, userId!),
    staleTime: CACHE_TTL.PRODUCT_DETAIL * 1000,
    enabled: productIds.length > 0 && !!userId,
  });
}
