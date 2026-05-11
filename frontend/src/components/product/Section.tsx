"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ProductCard } from "../product/ProductCard";

import type { Product } from "@/types/database";
import { SectionTitle } from "./SectionTitle";
import { ChevronLeft28, ChevronRight28 } from "../svg";

interface SectionProps {
  title: string;
  iconSrc?: string;
  href?: string;
  products?: Product[];
  children?: React.ReactNode;
}

const PRODUCT_WIDTH_MOBILE = 176 + 8; // ProductCard width + gap
const PRODUCT_WIDTH_DESKTOP = 254 + 16; // ProductCard width + gap

export const Section = ({
  title,
  iconSrc,
  href,
  products,
  children,
}: SectionProps) => {
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
      if (el) {
        el.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const isMobile = window.innerWidth < 768;
    const scrollAmount = isMobile
      ? PRODUCT_WIDTH_MOBILE
      : PRODUCT_WIDTH_DESKTOP;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products?.length && !children) return null;

  return (
    <div className="w-full bg-white flex justify-center group">
      <div className="py-10 sm:pt-8 sm:pb-0 md:pt-12 md:pb-0 flex flex-col gap-2 sm:gap-4 md:gap-4 px-4 md:px-0 max-w-[1064px] w-full relative">
        <SectionTitle title={title} iconSrc={iconSrc} href={href} />
        {children ?? (
          <div className="relative">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute -left-7 top-[170px] -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
                aria-label="Scroll left"
              >
                <ChevronLeft28 />
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute -right-7 top-[170px] -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
                aria-label="Scroll right"
              >
                <ChevronRight28 />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide"
            >
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
