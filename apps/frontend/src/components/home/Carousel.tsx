"use client";

import { useRef, useState } from "react";

import { CarouselSlide } from "./_carousel/_CarouselSlide";
import { buildSlides, type CarouselBanner } from "./_carousel/_types";
import { useAutoAdvance } from "./_carousel/_useAutoAdvance";
import { SNAP_TRANSITION, useCarouselDrag } from "./_carousel/_useCarouselDrag";
import { useResponsiveLayout } from "./_carousel/_useResponsiveLayout";

export type { CarouselBanner };

interface CarouselProps {
  banners?: CarouselBanner[];
}

export const Carousel = ({ banners }: CarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { slideWidth, gap, isReady, isMobile } = useResponsiveLayout(containerRef);
  const slides = buildSlides(banners, isMobile);

  const { currentSlide, setCurrentSlide, progress, setProgress } = useAutoAdvance({
    isPaused,
    isDragging: false,
    slidesLength: slides.length,
  });

  const { isDragging, dragRef, handleDragStart, handleDragMove, handleDragEnd } = useCarouselDrag({
    currentSlide,
    slidesLength: slides.length,
    slideWidth,
    gap,
    isMobile,
    setCurrentSlide,
    setProgress,
    trackRef,
  });

  if (slides.length === 0) return null;

  const offset = (slideWidth + gap) * currentSlide;
  const trackStyle = {
    transform: isMobile
      ? `translateX(calc(50% - ${slideWidth / 2}px - ${offset}px))`
      : `translateX(${-offset}px)`,
    transition: SNAP_TRANSITION,
    gap: `${gap}px`,
  };

  const onNext = () => {
    setCurrentSlide((currentSlide + 1) % slides.length);
    setProgress(0);
  };
  const onSelectSlide = (idx: number) => {
    setCurrentSlide(idx);
    setProgress(0);
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Сурталчилгааны slider"
      className={`w-full relative group overflow-hidden bg-white transition-opacity duration-200 touch-pan-y cursor-grab ${
        isDragging ? "cursor-grabbing" : ""
      } ${isReady ? "opacity-100" : "opacity-0"}`}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
      onMouseDown={(e) => {
        e.preventDefault();
        handleDragStart(e.clientX);
      }}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        if (dragRef.current.active) handleDragEnd();
      }}
    >
      <div
        ref={trackRef}
        className="flex py-[14px] md:py-0 will-change-transform"
        style={trackStyle}
      >
        {slides.map((slide, index) => (
          <CarouselSlide
            key={slide.id}
            slide={slide}
            index={index}
            currentSlide={currentSlide}
            slidesCount={slides.length}
            slideWidth={slideWidth}
            isMobile={isMobile}
            progress={progress}
            isPaused={isPaused}
            isDragging={isDragging}
            dragLastOffsetRef={dragRef}
            onTogglePause={() => setIsPaused(!isPaused)}
            onSelectSlide={onSelectSlide}
            onNext={onNext}
          />
        ))}
      </div>
    </div>
  );
};
