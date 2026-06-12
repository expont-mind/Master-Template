import { useQuery } from "@tanstack/react-query";

import { searchKeys, getTrendingSearches } from "@/lib/queries/search";

const DEFAULT_SEARCHES = ["Innisfree", "Тонус", "Арьс арчилгаа", "Сэрүм", "Нүүрний маск"];

export function useTrendingSearches(limit = 5) {
  return useQuery({
    queryKey: searchKeys.trending(),
    queryFn: () => getTrendingSearches(limit),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTrendingSearchesWithFallback(limit = 5) {
  const { data, isLoading } = useTrendingSearches(limit);
  const searches = data && data.length > 0 ? data.map((t) => t.query) : DEFAULT_SEARCHES;

  return {
    searches,
    isLoading,
    hasTrendingData: data && data.length > 0,
  };
}
