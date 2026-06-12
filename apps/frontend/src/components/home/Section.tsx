"use client";

import { useRef, useState, useEffect, useCallback } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { ChevronLeft28, ChevronRight28 } from "@/components/svg";

import { SectionTitle } from "./SectionTitle";

import type { Product } from "@/types/database";

interface SectionProps {
  title: string;
  iconSrc?: string;
  href?: string;
  products?: Product[];
  children?: React.ReactNode;
}

const PRODUCT_WIDTH_MOBILE = 176 + 8; // ProductCard width + gap
const PRODUCT_WIDTH_DESKTOP = 254 + 16; // ProductCard width + gap

export const Section = ({ title, iconSrc, href, products, children }: SectionProps) => {
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
    const scrollAmount = isMobile ? PRODUCT_WIDTH_MOBILE : PRODUCT_WIDTH_DESKTOP;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products?.length && !children) return null;

  return (
    <div className="w-full bg-white flex justify-center group">
      <div className="relative pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
            aria-label="Scroll left"
          >
            <ChevronLeft28 />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
            aria-label="Scroll right"
          >
            <ChevronRight28 />
          </button>
        )}

        <div className="px-4 md:px-0">
          <SectionTitle title={title} iconSrc={iconSrc} href={href} />
        </div>
        {children ?? (
          <div className="relative">
            {/* Gradients removed */}

            <div
              ref={scrollRef}
              className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0"
            >
              {products?.map((product, index) => (
                <div
                  key={product.id}
                  className={`shrink-0 w-[calc(40vw-16px)] sm:w-[254px] ${
                    index === products.length - 1 ? "mr-4 md:mr-0" : ""
                  }`}
                >
                  <ProductCard product={product} fillParent />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
