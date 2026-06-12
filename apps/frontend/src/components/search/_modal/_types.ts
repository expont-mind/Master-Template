import type { SearchSuggestion } from "@/lib/queries/search";

export type SearchItemType = "recent" | "popular" | "brand" | "category" | "product";

export interface SearchItem {
  type: SearchItemType;
  text: string;
  slug: string;
  original?: SearchSuggestion;
}
