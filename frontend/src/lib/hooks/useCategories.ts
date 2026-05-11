"use client";

import { useQuery } from "@tanstack/react-query";
import {
  productKeys,
  getCategories,
  PRODUCT_STALE_TIMES,
} from "@/lib/queries/products";

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: getCategories,
    staleTime: PRODUCT_STALE_TIMES.categories,
  });
}
