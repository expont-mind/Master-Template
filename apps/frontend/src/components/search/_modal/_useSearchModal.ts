"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRecentSearches } from "@/lib/hooks/useRecentSearches";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";
import { useTrendingSearchesWithFallback } from "@/lib/hooks/useTrendingSearches";
import { ROUTES } from "@/lib/utils/constants";

import { type SearchItem } from "./_types";
import { useSearchItems } from "./_useSearchItems";

export function useSearchModal(isOpen: boolean, onClose: () => void) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const { data: suggestions, isLoading } = useSearchSuggestions(searchQuery);
  const { recentSearches, addSearch } = useRecentSearches();
  const { searches: trendingSearches } = useTrendingSearchesWithFallback(5);

  const showRecent = searchQuery.length < 2 && recentSearches.length > 0;
  const showPopular = searchQuery.length < 2;
  const showSuggestions = searchQuery.length >= 2;

  const brandSuggestions = useMemo(
    () => suggestions?.filter((s) => s.type === "brand") ?? [],
    [suggestions],
  );
  const categorySuggestions = useMemo(
    () => suggestions?.filter((s) => s.type === "category") ?? [],
    [suggestions],
  );
  const productSuggestions = useMemo(
    () => suggestions?.filter((s) => s.type === "product") ?? [],
    [suggestions],
  );

  useEffect(() => {
    if (isOpen) {
      const currentQuery =
        typeof window !== "undefined"
          ? (new URLSearchParams(window.location.search).get("q") ?? "")
          : "";
      // Intentional sync from URL query param into local state on open.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(currentQuery);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        if (currentQuery) el.select();
      });
    } else {
      // Intentional reset when modal closes.
      setSearchQuery("");
      setHighlightIndex(-1);
    }
  }, [isOpen]);

  const items = useSearchItems({
    showRecent,
    showPopular,
    showSuggestions,
    recentSearches,
    trendingSearches,
    brandSuggestions,
    categorySuggestions,
    productSuggestions,
  });

  // Reset highlight whenever the search query changes (keyboard nav state).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightIndex(-1);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      addSearch(item.text);
      onClose();
      if (item.original?.type === "product") {
        router.push(ROUTES.PRODUCT(item.slug));
      } else if (item.original?.type === "category") {
        router.push(ROUTES.CATEGORY(item.slug));
      } else {
        router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(item.text)}`);
      }
    },
    [addSearch, onClose, router],
  );

  const submitFreeText = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      addSearch(trimmed);
      onClose();
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
    },
    [addSearch, onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIndex >= 0 && items[highlightIndex]) {
          handleSelect(items[highlightIndex]);
        } else {
          submitFreeText(searchQuery);
        }
        return;
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [items, highlightIndex, handleSelect, searchQuery, submitFreeText, onClose],
  );

  const clearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const noResults = showSuggestions && !isLoading && suggestions?.length === 0;

  return {
    inputRef,
    searchQuery,
    setSearchQuery,
    highlightIndex,
    isLoading,
    suggestions,
    showRecent,
    showPopular,
    showSuggestions,
    brandSuggestions,
    categorySuggestions,
    productSuggestions,
    recentSearches,
    trendingSearches,
    items,
    handleSelect,
    handleKeyDown,
    clearSearch,
    noResults,
  };
}
