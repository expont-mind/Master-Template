"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightWhite, Pause, Play } from "../svg";

export interface CarouselBanner {
  id: string;
  image_url: string;
  mobile_image_url?: string | null;
  background_color?: string;
  mobile_background_color?: string | null;
  category_id: string | null;
  product_id: string | null;
  link_url: string | null;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price: number | null;
    images: string[] | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CarouselProps {
  banners?: CarouselBanner[];
}

export const Carousel = ({ banners }: CarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [gap, setGap] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const slidesLengthRef = useRef(0);

  // Swipe/drag – refs for render-free smooth tracking
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    offset: 0,
    lastOffset: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
  });
  const rafRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragThreshold = 40;
  const snapTransition = "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)";

  const slides =
    banners && banners.length > 0
      ? banners.map((b) => {
          // Use mobile image/color on mobile if available, otherwise fallback to desktop
          const desktopImage = b.image_url || b.product?.images?.[0] || "";
          const mobileImage = b.mobile_image_url || desktopImage;
          const desktopBgColor = b.background_color || "#ffffff";
          const mobileBgColor = b.mobile_background_color || desktopBgColor;
          return {
            id: b.id,
            image: isMobile ? mobileImage : desktopImage,
            bgColor: isMobile ? mobileBgColor : desktopBgColor,
            link: b.product_id
              ? `/products/${b.product?.slug || b.product_id}`
              : b.category_id
                ? `/products?category=${b.category?.slug}`
                : b.link_url || null,
            hasLink: !!(b.product_id || b.category_id || b.link_url),
          };
        })
      : [];

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      const vw = containerRef.current.clientWidth;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        // Mobile: slide with gaps and peek of adjacent slides
        const mobileGap = 12;
        const sidePeek = 20; // How much of adjacent slides show on each side
        setSlideWidth(vw - sidePeek * 2 - mobileGap);
        setGap(mobileGap);
      } else {
        // Desktop: full container width, no gap
        setSlideWidth(vw);
        setGap(0);
      }
    };
    updateWidth();
    setIsReady(true);
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Keep slidesLengthRef in sync
  useEffect(() => {
    slidesLengthRef.current = slides.length;
  }, [slides.length]);

  // Auto-advance with progress
  useEffect(() => {
    if (isPaused || isDragging || slides.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2; // 2% every 100ms = 5 seconds total
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, isDragging, slides.length]);

  // Advance slide when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && slides.length > 0) {
      setCurrentSlide((curr) => (curr + 1) % slides.length);
      setProgress(0);
    }
  }, [progress, slides.length]);

  const offset = (slideWidth + gap) * currentSlide;

  // Helper: compute transform string
  const getTransform = (slideIdx: number, extra: number) => {
    const base = (slideWidth + gap) * slideIdx;
    return isMobile
      ? `translateX(calc(50% - ${slideWidth / 2}px - ${base}px + ${extra}px))`
      : `translateX(${-base + extra}px)`;
  };

  // Swipe handlers – manipulate DOM directly for smooth 60fps tracking
  const handleDragStart = (clientX: number) => {
    const now = Date.now();
    dragRef.current = {
      active: true,
      startX: clientX,
      offset: 0,
      lastOffset: 0,
      velocity: 0,
      lastX: clientX,
      lastTime: now,
    };
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    const d = dragRef.current;
    if (!d.active) return;

    // Smoothed velocity (exponential moving average)
    const now = Date.now();
    const dt = now - d.lastTime;
    if (dt > 0) {
      const instant = (clientX - d.lastX) / dt;
      d.velocity = d.velocity * 0.6 + instant * 0.4;
    }
    d.lastX = clientX;
    d.lastTime = now;

    let rawOffset = clientX - d.startX;

    // Rubber-band resistance at edges
    const atStart = currentSlide === 0 && rawOffset > 0;
    const atEnd = currentSlide === slides.length - 1 && rawOffset < 0;
    if (atStart || atEnd) {
      rawOffset *= 0.3;
    }

    d.offset = rawOffset;

    // Sync DOM update with display refresh
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none";
        trackRef.current.style.transform = getTransform(currentSlide, d.offset);
      }
    });
  };

  const handleDragEnd = () => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    d.lastOffset = d.offset;
    cancelAnimationFrame(rafRef.current);
    setIsDragging(false);

    // Re-enable CSS transition for snap
    if (trackRef.current) {
      trackRef.current.style.transition = snapTransition;
    }

    // Use velocity OR distance to determine slide change
    const swipeByVelocity = Math.abs(d.velocity) > 0.3;
    const swipeByDistance = Math.abs(d.offset) > dragThreshold;
    const direction = swipeByVelocity ? d.velocity : d.offset;

    let newSlide = currentSlide;
    if (swipeByVelocity || swipeByDistance) {
      if (direction > 0 && currentSlide > 0) {
        newSlide = currentSlide - 1;
      } else if (direction < 0 && currentSlide < slides.length - 1) {
        newSlide = currentSlide + 1;
      }
    }

    d.offset = 0;
    d.velocity = 0;
    if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
      setProgress(0);
    } else if (trackRef.current) {
      // Snap back
      trackRef.current.style.transform = getTransform(currentSlide, 0);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => handleDragEnd();

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => handleDragEnd();

  const handleMouseLeave = () => {
    if (dragRef.current.active) handleDragEnd();
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`w-full relative group overflow-hidden bg-white transition-opacity duration-200 touch-pan-y cursor-grab ${isDragging ? "cursor-grabbing" : ""} ${isReady ? "opacity-100" : "opacity-0"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={trackRef}
        className="flex py-[14px] md:py-0 will-change-transform"
        style={{
          transform: isMobile
            ? `translateX(calc(50% - ${slideWidth / 2}px - ${offset}px))`
            : `translateX(${-offset}px)`,
          transition: snapTransition,
          gap: `${gap}px`,
        }}
      >
        {slides.map((slide, index: number) => {
          const slideContent = (
            <>
              <div className="absolute w-full h-full flex items-center justify-center overflow-hidden">
                {/* Full cover background image */}
                {slide.image && (
                  <Image
                    src={slide.image}
                    alt="Banner"
                    fill
                    sizes="100vw"
                    quality={75}
                    className="object-contain object-center overflow-hidden"
                    priority={index === 0}
                  />
                )}
              </div>
              <div className="relative w-full max-w-[1064px] h-full flex items-center justify-center">
                {/* Indicator - bottom center on mobile, bottom right on desktop (only on current slide) */}
                {index === currentSlide && (
                  <div
                    className="absolute bottom-2 md:bottom-5 right-2 md:right-[15px] flex gap-1.5 items-center z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pause/Play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsPaused(!isPaused);
                      }}
                      className="bg-[rgba(255,255,255,0.80)] backdrop-blur-[50px] border-2 border-[rgba(255,255,255,0.10)] rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer"
                      aria-label={isPaused ? "Play" : "Pause"}
                    >
                      {isPaused ? (
                        <Play className="w-4 h-4 md:w-5 md:h-5 text-[#020617]" />
                      ) : (
                        <Pause className="w-4 h-4 md:w-5 md:h-5 text-[#020617]" />
                      )}
                    </button>

                    {/* Dots container */}
                    <div className="bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] h-10 md:h-12 px-4 md:px-5 flex items-center gap-2 md:gap-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-auto">
                      {slides.map((_, dotIndex: number) => (
                        <button
                          key={dotIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setCurrentSlide(dotIndex);
                            setProgress(0);
                          }}
                          className="relative"
                          aria-label={`Go to slide ${dotIndex + 1}`}
                        >
                          {dotIndex === currentSlide ? (
                            <div className="bg-[rgba(2,6,23,0.40)] rounded-full w-8 h-[6px] md:h-[7px] overflow-hidden">
                              <div
                                className="bg-[#020617] h-full rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="bg-[rgba(2,6,23,0.40)] rounded-full w-[6px] md:w-[7px] h-[6px] md:h-[7px] hover:bg-slate-500 transition-colors" />
                          )}
                        </button>
                      ))}

                      <div className="items-center gap-0.5 hidden md:flex">
                        <span className="text-[#020617] text-sm font-bold">
                          {currentSlide + 1}/{slides.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setCurrentSlide(
                              (curr) => (curr + 1) % slides.length,
                            );
                            setProgress(0);
                          }}
                          className="text-[#020617] cursor-pointer hover:text-[#020617]/80 transition-colors"
                          aria-label="Next slide"
                        >
                          <ChevronRightWhite />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          );

          const slideClassName =
            "shrink-0 relative flex justify-center items-center rounded-[26px] overflow-hidden md:rounded-none md:h-[410px]";
          const slideStyle = {
            width: slideWidth > 0 ? `${slideWidth}px` : undefined,
            height: isMobile && slideWidth > 0 ? `${Math.round((slideWidth * 10) / 9)}px` : undefined,
            backgroundColor: slide.bgColor,
          };

          return slide.hasLink && slide.link ? (
            <Link
              key={slide.id}
              href={slide.link}
              className={`${slideClassName} select-none`}
              style={slideStyle}
              onClick={(e) => {
                // Prevent navigation if user was dragging
                if (Math.abs(dragRef.current.lastOffset) > 5) {
                  e.preventDefault();
                }
              }}
              draggable={false}
            >
              {slideContent}
            </Link>
          ) : (
            <div
              key={slide.id}
              className={`${slideClassName} select-none`}
              style={slideStyle}
            >
              {slideContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};
