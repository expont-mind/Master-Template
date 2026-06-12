"use client";

import Image from "next/image";

import { Search } from "@/components/svg";

import type { AutocompleteSelection } from "./_useAutocompleteState";
import type { SearchSuggestion } from "@/lib/queries/search";

interface RecentSearchesListProps {
  recentSearches: string[];
  highlightIndex: number;
  baseIndex: number;
  onSelect: (text: string) => void;
  onRemove: (text: string) => void;
  onClearAll: () => void;
}

export function RecentSearchesList({
  recentSearches,
  highlightIndex,
  baseIndex,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchesListProps) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-text-secondary font-manrope uppercase tracking-wide">
          Сүүлд хайсан
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            onClearAll();
          }}
          className="text-xs text-text-muted hover:text-text-secondary font-manrope cursor-pointer"
        >
          Цэвэрлэх
        </button>
      </div>
      {recentSearches.map((text, i) => {
        const idx = baseIndex + i;
        return (
          <div
            key={text}
            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md ${
              highlightIndex === idx ? "bg-border-light" : "hover:bg-surface"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(text)}
              className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer text-left bg-transparent border-0 p-0"
            >
              <Search color="#94A3B8" width={14} height={14} />
              <span className="text-sm text-text-primary font-manrope truncate">{text}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(text);
              }}
              className="shrink-0 p-0.5 hover:bg-border rounded cursor-pointer"
              aria-label="Хайлтын түүхээс хасах"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M9 9L3 3" stroke="#94A3B8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface CategorySuggestionsListProps {
  suggestions: SearchSuggestion[];
  highlightIndex: number;
  baseIndex: number;
  onSelect: (s: AutocompleteSelection) => void;
}

export function CategorySuggestionsList({
  suggestions,
  highlightIndex,
  baseIndex,
  onSelect,
}: CategorySuggestionsListProps) {
  return (
    <div className="p-3 border-b border-border-light">
      <p className="text-xs font-semibold text-text-secondary font-manrope uppercase tracking-wide mb-2">
        Категори
      </p>
      {suggestions.map((suggestion, i) => {
        const idx = baseIndex + i;
        return (
          <button
            type="button"
            key={suggestion.slug}
            className={`flex w-full items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-left bg-transparent border-0 ${
              highlightIndex === idx ? "bg-border-light" : "hover:bg-surface"
            }`}
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.image && (
              <div className="w-6 h-6 rounded bg-border-light overflow-hidden shrink-0 relative">
                <Image
                  src={suggestion.image}
                  alt={suggestion.text}
                  fill
                  className="object-cover"
                  sizes="24px"
                  quality={90}
                />
              </div>
            )}
            <span className="text-sm text-text-primary font-manrope">{suggestion.text}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ProductSuggestionsListProps {
  suggestions: SearchSuggestion[];
  highlightIndex: number;
  baseIndex: number;
  onSelect: (s: AutocompleteSelection) => void;
}

export function ProductSuggestionsList({
  suggestions,
  highlightIndex,
  baseIndex,
  onSelect,
}: ProductSuggestionsListProps) {
  return (
    <div className="p-3">
      <p className="text-xs font-semibold text-text-secondary font-manrope uppercase tracking-wide mb-2">
        Бүтээгдэхүүн
      </p>
      {suggestions.map((suggestion, i) => {
        const idx = baseIndex + i;
        return (
          <button
            type="button"
            key={suggestion.slug}
            className={`flex w-full items-center gap-3 px-2 py-2 rounded-md cursor-pointer text-left bg-transparent border-0 ${
              highlightIndex === idx ? "bg-border-light" : "hover:bg-surface"
            }`}
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.image && (
              <div className="w-10 h-10 rounded bg-border-light overflow-hidden shrink-0 relative">
                <Image
                  src={suggestion.image}
                  alt={suggestion.text}
                  fill
                  className="object-cover"
                  sizes="40px"
                  quality={90}
                />
              </div>
            )}
            <span className="text-sm text-text-primary font-manrope truncate">
              {suggestion.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AutocompleteLoading() {
  return (
    <div className="p-4 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-border border-t-text-primary rounded-full animate-spin" />
    </div>
  );
}

export function AutocompleteEmptyState() {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4">
      <p className="text-sm text-text-secondary font-manrope text-center">Илэрц олдсонгүй</p>
    </div>
  );
}
