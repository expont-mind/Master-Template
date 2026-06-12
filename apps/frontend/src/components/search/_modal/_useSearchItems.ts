"use client";

import { useMemo } from "react";

import { type SearchItem } from "./_types";

import type { SearchSuggestion } from "@/lib/queries/search";

interface UseSearchItemsArgs {
  showRecent: boolean;
  showPopular: boolean;
  showSuggestions: boolean;
  recentSearches: string[];
  trendingSearches: string[];
  brandSuggestions: SearchSuggestion[];
  categorySuggestions: SearchSuggestion[];
  productSuggestions: SearchSuggestion[];
}

function pushSuggestions(
  list: SearchItem[],
  type: SearchItem["type"],
  suggestions: SearchSuggestion[],
) {
  for (const s of suggestions) {
    list.push({ type, text: s.text, slug: s.slug, original: s });
  }
}

export function useSearchItems(args: UseSearchItemsArgs): SearchItem[] {
  return useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    if (args.showRecent) {
      args.recentSearches.forEach((text) => list.push({ type: "recent", text, slug: "" }));
    }
    if (args.showPopular && !args.showSuggestions) {
      args.trendingSearches.forEach((text) => list.push({ type: "popular", text, slug: "" }));
    }
    if (args.showSuggestions) {
      pushSuggestions(list, "brand", args.brandSuggestions);
      pushSuggestions(list, "category", args.categorySuggestions);
      pushSuggestions(list, "product", args.productSuggestions);
    }
    return list;
  }, [
    args.showRecent,
    args.recentSearches,
    args.showPopular,
    args.showSuggestions,
    args.trendingSearches,
    args.brandSuggestions,
    args.categorySuggestions,
    args.productSuggestions,
  ]);
}
