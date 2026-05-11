"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import type { Category } from "@/types/database";
import { ChevronLeft28, ChevronRight28 } from "../svg";

interface CategoriesProps {
  categories?: Category[];
}

const CATEGORY_WIDTH_MOBILE = 56 + 16; // width + gap
const CATEGORY_WIDTH_DESKTOP = 96 + 16; // width + gap

export const Categories = ({ categories }: CategoriesProps) => {
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
      ? CATEGORY_WIDTH_MOBILE
      : CATEGORY_WIDTH_DESKTOP;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!categories?.length) return null;

  return (
    <div className="w-full bg-white flex justify-center group">
      <div className="relative py-4 sm:py-8 md:py-10 max-w-[1064px] w-full">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
            aria-label="Scroll left"
          >
            <ChevronLeft28 />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
            aria-label="Scroll right"
          >
            <ChevronRight28 />
          </button>
        )}

        {/* Scrollable Container with Gradients */}
        <div className="relative">
          {/* Gradients removed */}

          <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
            <div className="grid grid-rows-2 grid-flow-col gap-4 sm:grid-rows-1 sm:flex sm:items-start pl-4 md:pl-0">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={
                    index === categories.length - 1 ? "pr-4 md:pr-0" : ""
                  }
                >
                  <Link
                    href={ROUTES.CATEGORY(category.slug)}
                    className="flex flex-col gap-1.5 items-center shrink-0 w-[56px] md:w-[96px]"
                  >
                    <div className="w-[56px] md:w-[74px] h-[56px] md:h-[74px] bg-[#F8FAFC] rounded-[14px] md:rounded-[18px] p-1 flex items-start justify-center overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={74}
                          height={74}
                          quality={75}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#E2E8F0] rounded-[14px]" />
                      )}
                    </div>
                    <p className="text-[#020617] text-xs md:text-sm font-medium font-manrope text-center line-clamp-2 w-full overflow-hidden wrap-break-word">
                      {category.name}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
