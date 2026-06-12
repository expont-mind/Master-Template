"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

import { Filter } from "@/components/svg";

import { FilterActions, FilterInStock, FilterPriceRange } from "./_FilterPriceRange";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Local state for inputs
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");

  // Check if any filter is active
  const hasActiveFilters =
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.get("inStock") === "true";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      // Intentional sync: mount before the close timeout can hide it later.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Sync URL params to local state when they change
  useEffect(() => {
    // URL is the source of truth for filter state — sync local fields when it changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setInStock(searchParams.get("inStock") === "true");
  }, [searchParams]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (inStock) {
      params.set("inStock", "true");
    } else {
      params.delete("inStock");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  }, [minPrice, maxPrice, inStock, searchParams, router, pathname]);

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("inStock");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={panelRef}>
      <button
        className={`flex items-center px-[2px] border rounded-sm cursor-pointer min-h-[32px] sm:min-h-0 ${
          hasActiveFilters ? "border-text-primary bg-surface" : "border-border"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="pl-1.5 sm:pl-2 text-text-primary font-medium text-xs sm:text-sm font-manrope">
          Шүүх
        </p>
        <div className="p-1.5 sm:p-2">
          <Filter />
        </div>
        {hasActiveFilters && (
          <span className="mr-1.5 sm:mr-2 w-2 h-2 bg-text-primary rounded-full" />
        )}
      </button>

      {isVisible && (
        <div
          className={`absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-72 max-w-72 bg-white border border-border rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)] z-50 p-3 sm:p-4 overflow-hidden transition-all duration-200 origin-top-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <FilterPriceRange
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinChange={setMinPrice}
              onMaxChange={setMaxPrice}
            />
            <FilterInStock inStock={inStock} onChange={setInStock} />
            <FilterActions onClear={clearFilters} onApply={applyFilters} />
          </div>
        </div>
      )}
    </div>
  );
}
