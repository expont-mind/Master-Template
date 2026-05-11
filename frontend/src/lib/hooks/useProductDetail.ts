"use client";

import { useQuery } from "@tanstack/react-query";
import {
  productKeys,
  getProductBySlug,
  getRelatedProducts,
  PRODUCT_STALE_TIMES,
} from "@/lib/queries/products";

export function useProductDetail(slug: string, serverProduct?: any) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    staleTime: PRODUCT_STALE_TIMES.detail,
    // Default `refetchOnMount: true` already refetches when stale.
    // Forcing "always" was making the back-button to a recently-viewed
    // product re-hit Supabase even though the cache is fresh.
    enabled: !!slug,
    placeholderData: serverProduct,
  });
}

export function useRelatedProducts(
  productId: string,
  categoryId?: string,
  brandId?: string | null
) {
  return useQuery({
    queryKey: productKeys.related(productId),
    queryFn: () => getRelatedProducts(productId, categoryId, brandId),
    staleTime: PRODUCT_STALE_TIMES.list,
    enabled: !!productId,
  });
}
