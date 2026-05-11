"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { ROUTES } from "@/lib/utils/constants";
import { ChevronLeft28, ChevronRight28 } from "../svg";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BrandLogoSectionProps {
  brands: Brand[];
  title?: string;
  iconSrc?: string;
}

const BRAND_WIDTH_MOBILE = 96 + 8; // brand logo width + gap
const BRAND_WIDTH_DESKTOP = 200 + 8; // brand logo width + gap

export const BrandLogoSection = ({
  brands,
  title,
  iconSrc,
}: BrandLogoSectionProps) => {
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
    const scrollAmount = isMobile ? BRAND_WIDTH_MOBILE : BRAND_WIDTH_DESKTOP;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!brands?.length) return null;

  return (
    <div className="w-full bg-white flex justify-center group">
      <div className="pt-10 md:pt-16 pb-10 flex flex-col gap-4 md:gap-7 max-w-[1064px] w-full bg-[#F8FAFC] md:bg-white">
        <div className="px-4 md:px-0">
          <SectionTitle
            title={title || "Брэндүүд"}
            iconSrc={iconSrc || "/images/brand-icon.png"}
            href="/brands"
          />
        </div>

        <div className="relative">
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
          {/* Gradients removed */}

          <div
            ref={scrollRef}
            className="grid grid-rows-2 grid-flow-col gap-y-3 gap-x-2 md:gap-2 overflow-x-auto scrollbar-hide md:flex pl-4 md:pl-0"
          >
            {brands.map((brand, index) => (
              <Link
                key={brand.id}
                href={ROUTES.BRAND(brand.slug)}
                className={`shrink-0 ${index === brands.length - 1 ? "pr-4 md:pr-0" : ""}`}
              >
                <div className="w-[96px] h-[96px] md:w-[200px] md:h-[200px] rounded-full flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={200}
                      height={200}
                      quality={75}
                      className="object-cover w-full h-full rounded-full p-3 md:p-5"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600 text-center px-1">
                      {brand.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
