import { useInfiniteQuery } from "@tanstack/react-query";
import { searchKeys, searchProducts, type ProductFilters } from "@/lib/queries/search";

export function useSearchProducts(filters: Omit<ProductFilters, "limit" | "offset">) {
  return useInfiniteQuery({
    queryKey: searchKeys.results(filters),
    queryFn: ({ pageParam = 0 }) =>
      searchProducts({ ...filters, limit: 12, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!filters.search && filters.search.length >= 2,
  });
}
