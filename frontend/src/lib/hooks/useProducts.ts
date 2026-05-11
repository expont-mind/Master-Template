"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  productKeys,
  getProducts,
  PRODUCT_STALE_TIMES,
} from "@/lib/queries/products";
import type { ProductFilters } from "@/types/product";

export function useProducts(filters: ProductFilters = {}) {
  // Remove pagination params from filters for query key (they change with each page)
  const { limit, offset, ...baseFilters } = filters;

  return useInfiniteQuery({
    queryKey: productKeys.lists(baseFilters),
    queryFn: ({ pageParam = 0 }) =>
      getProducts({ ...baseFilters, limit: 12, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: PRODUCT_STALE_TIMES.list,
  });
}
