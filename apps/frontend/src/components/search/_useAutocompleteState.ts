"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRecentSearches } from "@/lib/hooks/useRecentSearches";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";

import type { SearchSuggestion } from "@/lib/queries/search";

export type AutocompleteSelection =
  | SearchSuggestion
  | { type: "recent"; text: string; slug: string };

export interface AutocompleteItem {
  type: string;
  text: string;
  slug: string;
  original?: SearchSuggestion;
}

interface UseAutocompleteStateArgs {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: AutocompleteSelection) => void;
  onClose: () => void;
}

export function useAutocompleteState({
  query,
  isOpen,
  onSelect,
  onClose,
}: UseAutocompleteStateArgs) {
  const { data: suggestions, isLoading } = useSearchSuggestions(query);
  const { recentSearches, removeSearch, clearAll } = useRecentSearches();
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const showRecent = query.length < 2 && recentSearches.length > 0;
  const showSuggestions = query.length >= 2;

  const productSuggestions = useMemo(
    () => suggestions?.filter((s) => s.type === "product") ?? [],
    [suggestions],
  );
  const categorySuggestions = useMemo(
    () => suggestions?.filter((s) => s.type === "category") ?? [],
    [suggestions],
  );

  // Build flat list for keyboard navigation. Memoized so the useCallback
  // below has stable deps (otherwise keyboard handler re-binds every render).
  const items = useMemo<AutocompleteItem[]>(() => {
    const list: AutocompleteItem[] = [];
    if (showRecent) {
      recentSearches.forEach((text) => list.push({ type: "recent", text, slug: "" }));
    }
    if (showSuggestions) {
      categorySuggestions.forEach((s) =>
        list.push({ type: "category", text: s.text, slug: s.slug, original: s }),
      );
      productSuggestions.forEach((s) =>
        list.push({ type: "product", text: s.text, slug: s.slug, original: s }),
      );
    }
    return list;
  }, [showRecent, recentSearches, showSuggestions, categorySuggestions, productSuggestions]);

  // Reset highlight when items change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- highlight resets every time the query or open state changes
    setHighlightIndex(-1);
  }, [query, isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        const item = items[highlightIndex];
        if (item.original) {
          onSelect(item.original);
        } else {
          onSelect({ type: "recent", text: item.text, slug: "" });
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [isOpen, items, highlightIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    isLoading,
    recentSearches,
    removeSearch,
    clearAll,
    productSuggestions,
    categorySuggestions,
    highlightIndex,
    showRecent,
    showSuggestions,
  };
}
