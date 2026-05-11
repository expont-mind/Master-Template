"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Sorting, Check } from "@/components/svg";
import { SORT_OPTIONS } from "@/lib/utils/constants";

export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") ?? "";
  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label ||
    "Санал болгох";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center px-[2px] border border-[#E2E8F0] rounded-sm cursor-pointer min-h-[32px] sm:min-h-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="pl-1.5 sm:pl-2 text-[#020617] font-medium text-xs sm:text-sm font-manrope">
          {currentLabel}
        </p>
        <div className="p-1.5 sm:p-2">
          <Sorting />
        </div>
      </button>

      {isVisible && (
        <div
          className={`absolute right-0 top-full mt-1 w-44 sm:w-48 bg-white border border-[#E2E8F0] rounded-lg p-1 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)] z-50 overflow-hidden transition-all duration-200 origin-top-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`w-full px-2 py-2 sm:py-1.5 flex items-center gap-2 text-left text-sm rounded-[6px] font-manrope hover:bg-[#F1F5F9] cursor-pointer transition-colors duration-150 min-h-[44px] sm:min-h-0 ${
                currentSort === option.value
                  ? "text-[#020617] font-semibold bg-[#F1F5F9]"
                  : "text-[#020617] font-normal"
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <span
                className={`w-4 h-4 flex items-center justify-center ${
                  currentSort === option.value ? "opacity-100" : "opacity-0"
                }`}
              >
                <Check />
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
