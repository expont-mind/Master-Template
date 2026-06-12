"use client";

import { forwardRef } from "react";

interface ProductTabsBarProps {
  activeTab: string;
  showTopHeader: boolean;
  reviewCount: number;
  onSelectBrief: () => void;
  onSelectDetails: () => void;
  onSelectReviews: () => void;
}

/**
 * Sticky tabs row: товч мэдээлэл / дэлгэрэнгүй тайлбар / сэтгэгдэл.
 * Clicking сэтгэгдэл on mobile opens a drawer instead of scrolling.
 *
 * The forwarded ref is the underlying sticky container — used by the
 * scroll-spy hook to compute viewport offsets.
 */
export const ProductTabsBar = forwardRef<HTMLDivElement, ProductTabsBarProps>(
  function ProductTabsBar(
    { activeTab, showTopHeader, reviewCount, onSelectBrief, onSelectDetails, onSelectReviews },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={`sticky z-40 bg-white mb-[10px] transition-[top] duration-300 ${showTopHeader ? "top-[93px] md:top-[131px]" : "top-[50px] md:top-[61px]"}`}
      >
        <div className="flex items-center gap-8 sm:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-0 max-w-[640px]">
          <button
            className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "brief" ? "border-text-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
            onClick={onSelectBrief}
          >
            Товч мэдээлэл
          </button>
          <button
            className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "details" ? "border-text-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
            onClick={onSelectDetails}
          >
            Дэлгэрэнгүй тайлбар
          </button>
          <button
            className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "reviews" ? "border-text-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
            onClick={onSelectReviews}
          >
            Сэтгэгдэл{reviewCount ? ` (${reviewCount})` : ""}
          </button>
        </div>
      </div>
    );
  },
);
