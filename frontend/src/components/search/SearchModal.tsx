"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { useRouter } from "next/navigation";
import { Search, Cancel, Clock, ArrowUpRight } from "../svg";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";
import { useRecentSearches } from "@/lib/hooks/useRecentSearches";
import { useTrendingSearchesWithFallback } from "@/lib/hooks/useTrendingSearches";
import { ROUTES } from "@/lib/utils/constants";
import type { SearchSuggestion } from "@/lib/queries/search";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const { data: suggestions, isLoading } = useSearchSuggestions(searchQuery);
  const { recentSearches, addSearch, removeSearch } = useRecentSearches();
  const { searches: trendingSearches } = useTrendingSearchesWithFallback(5);

  useScrollLock(isOpen);

  const showRecent = searchQuery.length < 2 && recentSearches.length > 0;
  const showPopular = searchQuery.length < 2;
  const showSuggestions = searchQuery.length >= 2;

  // Group suggestions by type
  const brandSuggestions = suggestions?.filter((s) => s.type === "brand") ?? [];
  const categorySuggestions =
    suggestions?.filter((s) => s.type === "category") ?? [];
  const productSuggestions =
    suggestions?.filter((s) => s.type === "product") ?? [];

  useEffect(() => {
    if (isOpen) {
      const currentQuery =
        typeof window !== "undefined"
          ? (new URLSearchParams(window.location.search).get("q") ?? "")
          : "";
      setSearchQuery(currentQuery);
      // Defer focus/select so the input is mounted and has the seeded value.
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        if (currentQuery) el.select();
      });
    } else {
      setSearchQuery("");
      setHighlightIndex(-1);
    }
  }, [isOpen]);

  // Build flat list for keyboard navigation
  const items: Array<{
    type: string;
    text: string;
    slug: string;
    original?: SearchSuggestion;
  }> = [];
  if (showRecent) {
    recentSearches.forEach((text) =>
      items.push({ type: "recent", text, slug: "" }),
    );
  }
  if (showPopular && !showSuggestions) {
    trendingSearches.forEach((text) =>
      items.push({ type: "popular", text, slug: "" }),
    );
  }
  if (showSuggestions) {
    brandSuggestions.forEach((s) =>
      items.push({ type: "brand", text: s.text, slug: s.slug, original: s }),
    );
    categorySuggestions.forEach((s) =>
      items.push({ type: "category", text: s.text, slug: s.slug, original: s }),
    );
    productSuggestions.forEach((s) =>
      items.push({ type: "product", text: s.text, slug: s.slug, original: s }),
    );
  }

  // Reset highlight when items change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (item: {
      type: string;
      text: string;
      slug: string;
      original?: SearchSuggestion;
    }) => {
      addSearch(item.text);
      onClose();

      if (item.original?.type === "product") {
        router.push(ROUTES.PRODUCT(item.slug));
      } else if (item.original?.type === "category") {
        router.push(ROUTES.CATEGORY(item.slug));
      } else {
        // Recent or popular search - navigate to search page
        router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(item.text)}`);
      }
    },
    [addSearch, onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIndex >= 0 && items[highlightIndex]) {
          handleSelect(items[highlightIndex]);
        } else if (searchQuery.trim()) {
          addSearch(searchQuery.trim());
          onClose();
          router.push(
            `${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`,
          );
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [
      items,
      highlightIndex,
      handleSelect,
      searchQuery,
      addSearch,
      onClose,
      router,
    ],
  );

  const clearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const noResults = showSuggestions && !isLoading && suggestions?.length === 0;

  return (
    <div
      className="fixed inset-0 z-999 overflow-hidden"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.3)]"
        style={{ touchAction: "none" }}
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white">
        {/* Top Nav / Search Input */}
        <div className="flex items-center justify-center pt-4 pb-3 px-4">
          <div className="flex items-center gap-6 w-full max-w-[1064px]">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-0.5 p-1 border border-[#E2E8F0] rounded-lg bg-white">
              <div className="p-1.5">
                <Search color="#94A3B8" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Бараа, брэнд, категори хайх"
                className="flex-1 outline-none text-sm text-[#020617] font-manrope placeholder:text-[#64748B]"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 cursor-pointer hover:bg-[#F1F5F9] rounded transition-colors"
                >
                  <Cancel />
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-[#F1F5F9] rounded transition-colors"
            >
              <Cancel />
            </button>
          </div>
        </div>

        {/* Results container */}
        <div className="flex flex-col items-center pt-2 pb-6 px-4 bg-white">
          <div className="w-full max-w-[1064px]">
            {/* Loading state */}
            {showSuggestions && isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#020617] rounded-full animate-spin" />
              </div>
            )}

            {/* No results */}
            {noResults && (
              <div className="py-6">
                <p className="text-base text-[#020617] font-manrope">
                  "{searchQuery}" хайлтад илэрц олдсонгүй
                </p>
              </div>
            )}

            {/* Search results with suggestions */}
            {showSuggestions &&
              !isLoading &&
              suggestions &&
              suggestions.length > 0 && (
                <div className="flex flex-col">
                  {/* Section header */}
                  <div className="pt-3 pb-2 pl-0.5">
                    <p className="text-base font-medium text-[#020617] font-manrope">
                      Илэрц
                    </p>
                  </div>

                  {/* Brand suggestions */}
                  {brandSuggestions.length > 0 && (
                    <>
                      <div className="bg-[#F8FAFC] px-4 py-2 w-full">
                        <p className="text-xs font-light text-[#64748B] font-manrope">
                          Брэнд
                        </p>
                      </div>
                      {brandSuggestions.map((suggestion, idx) => {
                        const itemIndex = items.findIndex(
                          (i) =>
                            i.type === "brand" && i.slug === suggestion.slug,
                        );
                        return (
                          <button
                            key={`brand-${suggestion.slug}`}
                            onClick={() =>
                              handleSelect({
                                type: "brand",
                                text: suggestion.text,
                                slug: suggestion.slug,
                                original: suggestion,
                              })
                            }
                            className={`flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors ${
                              highlightIndex === itemIndex
                                ? "bg-[#F1F5F9]"
                                : "hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <p className="text-base text-[#64748B] font-manrope truncate flex-1 min-w-0 text-left">
                              {suggestion.text}
                            </p>
                            <Search
                              color="#94A3B8"
                              width={24}
                              height={24}
                              className="shrink-0"
                            />
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Category suggestions */}
                  {categorySuggestions.length > 0 && (
                    <>
                      <div className="bg-[#F8FAFC] px-4 py-2 w-full">
                        <p className="text-xs font-light text-[#64748B] font-manrope">
                          Категори
                        </p>
                      </div>
                      {categorySuggestions.map((suggestion) => {
                        const itemIndex = items.findIndex(
                          (i) =>
                            i.type === "category" && i.slug === suggestion.slug,
                        );
                        return (
                          <button
                            key={`category-${suggestion.slug}`}
                            onClick={() =>
                              handleSelect({
                                type: "category",
                                text: suggestion.text,
                                slug: suggestion.slug,
                                original: suggestion,
                              })
                            }
                            className={`flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors ${
                              highlightIndex === itemIndex
                                ? "bg-[#F1F5F9]"
                                : "hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <p className="text-base text-[#64748B] font-manrope truncate flex-1 min-w-0 text-left">
                              {suggestion.text}
                            </p>
                            <Search
                              color="#94A3B8"
                              width={24}
                              height={24}
                              className="shrink-0"
                            />
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Product suggestions */}
                  {productSuggestions.length > 0 && (
                    <>
                      <div className="bg-[#F8FAFC] px-4 py-2 w-full">
                        <p className="text-xs font-light text-[#64748B] font-manrope">
                          Бараа
                        </p>
                      </div>
                      {productSuggestions.map((suggestion) => {
                        const itemIndex = items.findIndex(
                          (i) =>
                            i.type === "product" && i.slug === suggestion.slug,
                        );
                        return (
                          <button
                            key={`product-${suggestion.slug}`}
                            onClick={() =>
                              handleSelect({
                                type: "product",
                                text: suggestion.text,
                                slug: suggestion.slug,
                                original: suggestion,
                              })
                            }
                            className={`flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors ${
                              highlightIndex === itemIndex
                                ? "bg-[#F1F5F9]"
                                : "hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <p className="text-base text-[#64748B] font-manrope truncate flex-1 min-w-0 text-left">
                              {suggestion.text}
                            </p>
                            <Search
                              color="#94A3B8"
                              width={24}
                              height={24}
                              className="shrink-0"
                            />
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

            {/* Recent searches + Popular searches (when no query) */}
            {!showSuggestions && (
              <div className="flex flex-col">
                {/* Recent searches */}
                {showRecent && (
                  <>
                    <div className="pt-3 pb-2 pl-0.5">
                      <p className="text-base font-medium text-[#020617] font-manrope">
                        Сүүлд хайсан
                      </p>
                    </div>
                    {recentSearches.slice(0, 2).map((text, idx) => (
                      <button
                        key={text}
                        onClick={() =>
                          handleSelect({ type: "recent", text, slug: "" })
                        }
                        className={`flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors ${
                          highlightIndex === idx
                            ? "bg-[#F1F5F9]"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <p className="text-base text-[#64748B] font-manrope truncate flex-1 min-w-0 text-left">
                          {text}
                        </p>
                        <ClockIcon />
                      </button>
                    ))}
                  </>
                )}

                {/* Popular searches */}
                {showPopular && (
                  <>
                    <div className="pt-3 pb-2 pl-0.5">
                      <p className="text-base font-medium text-[#020617] font-manrope">
                        Их хайдаг
                      </p>
                    </div>
                    {trendingSearches.map((text, idx) => {
                      const itemIndex = showRecent
                        ? recentSearches.slice(0, 2).length + idx
                        : idx;
                      return (
                        <button
                          key={text}
                          onClick={() =>
                            handleSelect({ type: "popular", text, slug: "" })
                          }
                          className={`flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors ${
                            highlightIndex === itemIndex
                              ? "bg-[#F1F5F9]"
                              : "hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <p className="text-base text-[#64748B] font-manrope truncate flex-1 min-w-0 text-left">
                            {text}
                          </p>
                          <ArrowUpRight color="#94A3B8" className="shrink-0" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Clock icon component (24x24)
function ClockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#94A3B8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6V12L16 14"
        stroke="#94A3B8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
