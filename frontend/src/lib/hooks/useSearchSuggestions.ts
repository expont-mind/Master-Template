import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";
import { searchKeys, getSearchSuggestions } from "@/lib/queries/search";
import { CACHE_TTL } from "@/lib/utils/constants";

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebounce(query.trim());

  return useQuery({
    queryKey: searchKeys.suggestions(debouncedQuery),
    queryFn: () => getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: CACHE_TTL.SEARCH_SUGGESTIONS * 1000,
  });
}
