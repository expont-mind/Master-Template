"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";

import { ChevronLeft28, ChevronRight28 } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

export type PromoBanner = {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  background_color: string;
  mobile_background_color: string | null;
  link_url: string | null;
  category_id: string | null;
  product_id: string | null;
  product?: { slug: string } | null;
  category?: { slug: string } | null;
  sort_order?: number;
};

interface RotatingPromoBannerProps {
  banners: PromoBanner[];
}

function resolvePromoLink(promo: PromoBanner): string | null {
  if (promo.product_id) {
    return ROUTES.PRODUCT(promo.product?.slug ?? promo.product_id);
  }
  if (promo.category_id) {
    return promo.category?.slug ? ROUTES.CATEGORY(promo.category.slug) : ROUTES.PRODUCTS;
  }
  return promo.link_url ?? null;
}

function BannerSlide({ promo }: { promo: PromoBanner }) {
  const link = resolvePromoLink(promo);
  const content = (
    <>
      <div className="w-full hidden md:block h-full relative">
        <Image
          src={promo.image_url}
          alt="Promo banner"
          width={1900}
          height={200}
          className="w-full h-full object-contain"
          style={{ backgroundColor: promo.background_color }}
          unoptimized
        />
      </div>
      <div className="w-full md:hidden block h-full relative">
        <Image
          src={promo.mobile_image_url ?? promo.image_url}
          alt="Promo banner"
          width={488}
          height={136}
          className="w-full h-full object-contain"
          style={{
            backgroundColor: promo.mobile_background_color ?? promo.background_color,
          }}
          unoptimized
        />
      </div>
    </>
  );

  return (
    <div className="w-full h-full shrink-0">
      {link ? (
        <a href={link} className="block w-full h-full">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function BannerIndicators({
  banners,
  currentIndex,
  progress,
  onGo,
  onResetProgress,
}: {
  banners: PromoBanner[];
  currentIndex: number;
  progress: number;
  onGo: (i: number) => void;
  onResetProgress: () => void;
}) {
  return (
    <div className="absolute px-4 py-3 bottom-0 left-1/2 -translate-x-1/2 flex gap-2.5 items-center z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
      {banners.map((banner, index) => (
        <button
          key={banner.id}
          onClick={() => {
            onGo(index);
            onResetProgress();
          }}
          className="relative cursor-pointer"
          aria-label={`Go to banner ${index + 1}`}
        >
          {index === currentIndex ? (
            <div className="bg-text-primary/20 rounded-full w-8 h-[6px] md:h-[7px] overflow-hidden">
              <div
                className="bg-text-secondary h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <div className="bg-text-primary/20 rounded-full w-[6px] md:w-[7px] h-[6px] md:h-[7px] hover:bg-slate-500 transition-colors" />
          )}
        </button>
      ))}
    </div>
  );
}

export function RotatingPromoBanner({ banners }: RotatingPromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % banners.length) + banners.length) % banners.length);
    },
    [banners.length],
  );

  const goNext = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    setDragOffset(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;
    const threshold = 50;
    if (dragOffset < -threshold) {
      goNext();
      setProgress(0);
    } else if (dragOffset > threshold) {
      goPrev();
      setProgress(0);
    }
    touchStartX.current = null;
    setDragOffset(0);
    setIsSwiping(false);
  }, [dragOffset, goNext, goPrev]);

  // Auto-advance with progress: tick progress, and on overflow advance the slide.
  // Both updates happen inside the setInterval callback (async), so they don't
  // count as setState-in-effect-body.
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev + 2 >= 100) {
          setCurrentIndex((cur) => (cur + 1) % banners.length);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full flex justify-center group">
      <div className="py-10 md:py-[100px] max-w-[1900px] w-full relative">
        {/* Arrows */}
        <div className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none">
          <div className="relative max-w-[1064px] w-full h-full">
            {banners.length > 1 && (
              <button
                onClick={goPrev}
                className="pointer-events-auto hidden md:flex absolute -left-7 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
                aria-label="Previous banner"
              >
                <ChevronLeft28 />
              </button>
            )}
            {banners.length > 1 && (
              <button
                onClick={goNext}
                className="pointer-events-auto hidden md:flex absolute -right-7 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
                aria-label="Next banner"
              >
                <ChevronRight28 />
              </button>
            )}
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full h-[136px] md:h-[200px] overflow-hidden">
          <div
            ref={containerRef}
            className={`flex w-full h-full ${isSwiping ? "" : "transition-transform duration-500 ease-in-out"}`}
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {banners.map((promo) => (
              <BannerSlide key={promo.id} promo={promo} />
            ))}
          </div>
          {banners.length > 1 && (
            <BannerIndicators
              banners={banners}
              currentIndex={currentIndex}
              progress={progress}
              onGo={goTo}
              onResetProgress={() => setProgress(0)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
