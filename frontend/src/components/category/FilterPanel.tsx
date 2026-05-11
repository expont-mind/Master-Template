"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "@/components/svg";
import { useDebounce } from "@/lib/hooks/useDebounce";

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
  const [inStock, setInStock] = useState(
    searchParams.get("inStock") === "true",
  );

  // Check if any filter is active
  const hasActiveFilters =
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.get("inStock") === "true";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Sync URL params to local state when they change
  useEffect(() => {
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
  }, [minPrice, maxPrice, inStock, searchParams, router]);

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
          hasActiveFilters
            ? "border-[#020617] bg-[#F8FAFC]"
            : "border-[#E2E8F0]"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="pl-1.5 sm:pl-2 text-[#020617] font-medium text-xs sm:text-sm font-manrope">
          Шүүх
        </p>
        <div className="p-1.5 sm:p-2">
          <Filter />
        </div>
        {hasActiveFilters && (
          <span className="mr-1.5 sm:mr-2 w-2 h-2 bg-[#020617] rounded-full" />
        )}
      </button>

      {isVisible && (
        <div
          className={`absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-72 max-w-72 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)] z-50 p-3 sm:p-4 overflow-hidden transition-all duration-200 origin-top-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Price Range */}
            <div>
              <p className="text-[#020617] font-medium text-sm font-manrope mb-2">
                Үнийн хязгаар
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Бага"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-[#E2E8F0] rounded-sm text-sm font-manrope focus:outline-none focus:border-[#020617] transition-all duration-200 text-[#020617] placeholder:text-[#64748B]"
                />
                <span className="text-[#64748B]">—</span>
                <input
                  type="number"
                  placeholder="Их"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-[#E2E8F0] rounded-sm text-sm font-manrope focus:outline-none focus:border-[#020617] transition-all duration-200 text-[#020617] placeholder:text-[#64748B]"
                />
              </div>
            </div>

            {/* In Stock */}
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#E2E8F0] accent-[#020617] cursor-pointer"
              />
              <span className="text-[#020617] text-sm font-manrope">
                Зөвхөн нөөцөд байгаа
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={clearFilters}
                className="flex-1 px-3 py-2.5 sm:py-2 text-sm font-manrope text-[#64748B] hover:text-[#020617] transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
              >
                Цэвэрлэх
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-3 py-2.5 sm:py-2 bg-[#020617] text-white text-sm font-manrope rounded-sm hover:bg-[#1e293b] transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
              >
                Хэрэглэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
