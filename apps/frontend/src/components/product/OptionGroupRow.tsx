"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronRight16 } from "@/components/svg";

import type { OptionGroup } from "@/lib/queries/products";

const ITEM_WIDTH = 140;

interface OptionGroupRowProps {
  group: OptionGroup;
  selectedOptions: Record<string, string>;
  getVariantImageForValue: (value: string) => string | null;
  onOptionSelect: (groupType: string, value: string) => void;
  isValueOutOfStock: (value: string) => boolean;
  isOptional?: boolean;
}

/**
 * Horizontally-scrollable picker for one option dimension (e.g. "Хэмжээ").
 * Wraps values into 1-3 rows based on count, shows hover-revealed scroll
 * arrows on desktop, hides out-of-stock values via opacity.
 */
export function OptionGroupRow({
  group,
  selectedOptions,
  getVariantImageForValue,
  onOptionSelect,
  isValueOutOfStock,
  isOptional = false,
}: OptionGroupRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -ITEM_WIDTH : ITEM_WIDTH,
      behavior: "smooth",
    });
  };

  const total = group.values.length;
  const rowCount = total <= 3 ? 1 : total <= 6 ? 2 : 3;
  const itemsPerRow = Math.ceil(total / rowCount);
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    group.values.slice(rowIndex * itemsPerRow, (rowIndex + 1) * itemsPerRow),
  ).filter((r) => r.length > 0);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-text-primary font-medium text-sm px-0.5 font-manrope">
        {group.type}
        {isOptional && (
          <span className="text-text-muted font-normal text-xs ml-1">(заавал биш)</span>
        )}
      </p>
      <div className="relative group/scroll">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-surface"
            aria-label="Scroll left"
          >
            <div className="rotate-180">
              <ChevronRight16 />
            </div>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-surface"
            aria-label="Scroll right"
          >
            <ChevronRight16 />
          </button>
        )}

        {canScrollRight && (
          <div
            className="hidden md:block absolute right-0 top-0 bottom-0 w-10 z-5 pointer-events-none"
            style={{
              background: "linear-gradient(270deg, #FFF 0%, rgba(255,255,255,0) 100%)",
            }}
          />
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
          <div className="flex flex-col gap-2 w-max">
            {rows.map((rowValues) => (
              <div key={rowValues.join("|")} className="flex gap-2">
                {rowValues.map((value) => (
                  <OptionValueButton
                    key={value}
                    value={value}
                    isSelected={selectedOptions[group.type] === value}
                    variantImage={getVariantImageForValue(value)}
                    outOfStock={isValueOutOfStock(value)}
                    onSelect={() => onOptionSelect(group.type, value)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionValueButton({
  value,
  isSelected,
  variantImage,
  outOfStock,
  onSelect,
}: {
  value: string;
  isSelected: boolean;
  variantImage: string | null;
  outOfStock: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={() => !outOfStock && onSelect()}
      disabled={outOfStock}
      className={`p-0.5 border rounded-lg flex items-center gap-2 transition-all duration-200 ${
        outOfStock
          ? "opacity-40 cursor-not-allowed"
          : isSelected
            ? "border-text-primary bg-white shadow-sm cursor-pointer"
            : "border-transparent bg-white hover:border-border-strong cursor-pointer"
      }`}
    >
      <div className="flex items-center border border-border rounded-[6px] h-[30px] overflow-hidden">
        {variantImage ? (
          <Image
            src={variantImage}
            alt={value}
            width={32}
            height={32}
            quality={90}
            className="w-7 h-7 object-cover object-center"
          />
        ) : null}
        <div
          className={`text-xs font-normal min-w-[45px] ${
            variantImage ? "pl-1" : "pl-2"
          } pr-2 py-1.5 text-text-primary`}
        >
          <span>{value}</span>
        </div>
      </div>
    </button>
  );
}
