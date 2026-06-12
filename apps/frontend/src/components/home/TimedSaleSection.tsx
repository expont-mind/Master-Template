"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { ChevronLeft28, ChevronRight28 } from "@/components/svg";

import { SectionTitle } from "./SectionTitle";

import type { Product } from "@/types/database";

interface TimedSaleSectionProps {
  products: Product[];
  href?: string;
  iconSrc?: string;
}

const PRODUCT_WIDTH_DESKTOP = 254 + 16;

const getTimeUntilMidnight = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const ubHours = get("hour");
  const ubMinutes = get("minute");
  const ubSeconds = get("second");
  const secondsUntilMidnight =
    (24 - ubHours - 1) * 3600 + (60 - ubMinutes - 1) * 60 + (60 - ubSeconds);
  return secondsUntilMidnight * 1000;
};

const msToTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

export const TimedSaleSection = ({ products, href, iconSrc }: TimedSaleSectionProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // SSR/CSR hydration boundary + initial countdown sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
    setTimeLeft(msToTime(getTimeUntilMidnight()));
    const timer = setInterval(() => {
      setTimeLeft(msToTime(getTimeUntilMidnight()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      left: direction === "left" ? -PRODUCT_WIDTH_DESKTOP : PRODUCT_WIDTH_DESKTOP,
      behavior: "smooth",
    });
  };

  if (!products?.length) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const timerText = hasMounted
    ? `${pad(timeLeft.hours)} : ${pad(timeLeft.minutes)} : ${pad(timeLeft.seconds)}`
    : "00 : 00 : 00";

  return (
    <div className="w-full bg-white flex justify-center group">
      <div className="relative pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
            aria-label="Scroll left"
          >
            <ChevronLeft28 />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
            aria-label="Scroll right"
          >
            <ChevronRight28 />
          </button>
        )}

        <div className="flex flex-col gap-0 md:gap-2">
          <div className="px-4 md:px-0">
            <SectionTitle title="Хугацаатай хямдрал" iconSrc={iconSrc} href={href} />
          </div>

          <div className="px-4 md:px-0">
            <div className="bg-rose-50 rounded-lg px-3 ml-6 md:ml-0 py-1 md:py-1.5 w-fit">
              <span className="text-rose-500 font-bold text-xl font-manrope leading-7 whitespace-nowrap">
                {timerText}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0"
          >
            {products.map((product, index) => (
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
      </div>
    </div>
  );
};
