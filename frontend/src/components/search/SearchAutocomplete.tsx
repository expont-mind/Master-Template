"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";
import { useRecentSearches } from "@/lib/hooks/useRecentSearches";
import { formatPrice } from "@/lib/utils/formatters";
import { Search, Cancel } from "../svg";
import type { SearchSuggestion } from "@/lib/queries/search";

interface SearchAutocompleteProps {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: SearchSuggestion | { type: "recent"; text: string; slug: string }) => void;
  onClose: () => void;
}

export function SearchAutocomplete({ query, isOpen, onSelect, onClose }: SearchAutocompleteProps) {
  const { data: suggestions, isLoading } = useSearchSuggestions(query);
  const { recentSearches, removeSearch, clearAll } = useRecentSearches();
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const showRecent = query.length < 2 && recentSearches.length > 0;
  const showSuggestions = query.length >= 2;

  const productSuggestions = suggestions?.filter((s) => s.type === "product") ?? [];
  const categorySuggestions = suggestions?.filter((s) => s.type === "category") ?? [];

  // Build flat list for keyboard navigation
  const items: Array<{ type: string; text: string; slug: string; original?: SearchSuggestion }> = [];
  if (showRecent) {
    recentSearches.forEach((text) => items.push({ type: "recent", text, slug: "" }));
  }
  if (showSuggestions) {
    categorySuggestions.forEach((s) => items.push({ type: "category", text: s.text, slug: s.slug, original: s }));
    productSuggestions.forEach((s) => items.push({ type: "product", text: s.text, slug: s.slug, original: s }));
  }

  // Reset highlight when items change
  useEffect(() => {
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

  if (!isOpen) return null;
  if (!showRecent && !showSuggestions) return null;
  if (showSuggestions && !isLoading && productSuggestions.length === 0 && categorySuggestions.length === 0) {
    if (query.length >= 2) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 p-4">
          <p className="text-sm text-[#64748B] font-manrope text-center">
            Илэрц олдсонгүй
          </p>
        </div>
      );
    }
    return null;
  }

  let flatIndex = -1;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
      {/* Recent searches */}
      {showRecent && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#64748B] font-manrope uppercase tracking-wide">
              Сүүлд хайсан
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                clearAll();
              }}
              className="text-xs text-[#94A3B8] hover:text-[#64748B] font-manrope cursor-pointer"
            >
              Цэвэрлэх
            </button>
          </div>
          {recentSearches.map((text) => {
            flatIndex++;
            const idx = flatIndex;
            return (
              <div
                key={text}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                  highlightIndex === idx ? "bg-[#F1F5F9]" : "hover:bg-[#F8FAFC]"
                }`}
                onClick={() => onSelect({ type: "recent", text, slug: "" })}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Search color="#94A3B8" width={14} height={14} />
                  <span className="text-sm text-[#020617] font-manrope truncate">{text}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearch(text);
                  }}
                  className="shrink-0 p-0.5 hover:bg-[#E2E8F0] rounded cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M9 9L3 3" stroke="#94A3B8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {showSuggestions && isLoading && (
        <div className="p-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#E2E8F0] border-t-[#020617] rounded-full animate-spin" />
        </div>
      )}

      {/* Category suggestions */}
      {showSuggestions && !isLoading && categorySuggestions.length > 0 && (
        <div className="p-3 border-b border-[#F1F5F9]">
          <p className="text-xs font-semibold text-[#64748B] font-manrope uppercase tracking-wide mb-2">
            Категори
          </p>
          {categorySuggestions.map((suggestion) => {
            flatIndex++;
            const idx = flatIndex;
            return (
              <div
                key={suggestion.slug}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                  highlightIndex === idx ? "bg-[#F1F5F9]" : "hover:bg-[#F8FAFC]"
                }`}
                onClick={() => onSelect(suggestion)}
              >
                {suggestion.image && (
                  <div className="w-6 h-6 rounded bg-[#F1F5F9] overflow-hidden shrink-0 relative">
                    <Image src={suggestion.image} alt="" fill className="object-cover" sizes="24px" quality={75} />
                  </div>
                )}
                <span className="text-sm text-[#020617] font-manrope">{suggestion.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Product suggestions */}
      {showSuggestions && !isLoading && productSuggestions.length > 0 && (
        <div className="p-3">
          <p className="text-xs font-semibold text-[#64748B] font-manrope uppercase tracking-wide mb-2">
            Бүтээгдэхүүн
          </p>
          {productSuggestions.map((suggestion) => {
            flatIndex++;
            const idx = flatIndex;
            return (
              <div
                key={suggestion.slug}
                className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer ${
                  highlightIndex === idx ? "bg-[#F1F5F9]" : "hover:bg-[#F8FAFC]"
                }`}
                onClick={() => onSelect(suggestion)}
              >
                {suggestion.image && (
                  <div className="w-10 h-10 rounded bg-[#F1F5F9] overflow-hidden shrink-0 relative">
                    <Image src={suggestion.image} alt="" fill className="object-cover" sizes="40px" quality={75} />
                  </div>
                )}
                <span className="text-sm text-[#020617] font-manrope truncate">{suggestion.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
