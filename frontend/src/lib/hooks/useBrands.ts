import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getBrands,
  getBrandBySlug,
  getProductsByBrand,
  brandKeys,
} from "@/lib/queries/brands";
import { CACHE_TTL } from "@/lib/utils/constants";

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.lists(),
    queryFn: getBrands,
    staleTime: CACHE_TTL.CATEGORIES * 1000,
  });
}

export function useBrandDetail(slug: string) {
  return useQuery({
    queryKey: brandKeys.detail(slug),
    queryFn: () => getBrandBySlug(slug),
    staleTime: CACHE_TTL.CATEGORIES * 1000,
    enabled: !!slug,
  });
}


export function useBrandProducts(
  slug: string,
  filters: {
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  } = {},
) {
  // Remove pagination params from filters for query key
  const { ...baseFilters } = filters;

  return useInfiniteQuery({
    queryKey: brandKeys.products(slug, baseFilters),
    queryFn: ({ pageParam = 0 }) =>
      getProductsByBrand(slug, { ...baseFilters, limit: 12, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: CACHE_TTL.PRODUCTS_LIST * 1000,
    enabled: !!slug,
  });
}
