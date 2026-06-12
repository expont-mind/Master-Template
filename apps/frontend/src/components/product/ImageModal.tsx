"use client";

// Full-screen image modal with horizontal scroll-snap carousel +
// wrap-around animation when stepping past the first/last image.
// Carousel state lives in useImageCarousel.

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronLeftBig, ChevronRightBig } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { useImageCarousel } from "./_useImageCarousel";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
}

function CarouselNavButtons({
  animate,
  onPrevious,
  onNext,
}: {
  animate: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrevious();
        }}
        className="absolute left-4 z-10 w-14 h-14 flex items-center justify-center bg-text-primary/10 hover:bg-text-primary/20 rounded-lg transition-all duration-200 cursor-pointer"
        style={{ opacity: animate ? 1 : 0 }}
        aria-label="Previous image"
      >
        <ChevronLeftBig />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 z-10 w-14 h-14 flex items-center justify-center bg-text-primary/10 hover:bg-text-primary/20 rounded-lg transition-all duration-200 cursor-pointer"
        style={{ opacity: animate ? 1 : 0 }}
        aria-label="Next image"
      >
        <ChevronRightBig />
      </button>
    </>
  );
}

function CarouselTrack({
  scrollRef,
  onScroll,
  images,
  currentIndex,
  productName,
  wrapAnimation,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  images: string[];
  currentIndex: number;
  productName: string;
  wrapAnimation: "left" | "right" | null;
}) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      style={{
        scrollSnapType: wrapAnimation ? "none" : "x mandatory",
        transform: wrapAnimation
          ? wrapAnimation === "left"
            ? "translateX(-100%)"
            : "translateX(100%)"
          : "translateX(0)",
        transition: wrapAnimation ? "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none",
      }}
    >
      {images.map((image, index) => (
        <div key={image} className="shrink-0 w-full h-full snap-center relative">
          <Image
            src={image}
            alt={`${productName} - ${index + 1}`}
            fill
            sizes="calc(100vh - 80px)"
            quality={90}
            className="object-contain"
            priority={index === currentIndex}
          />
        </div>
      ))}
    </div>
  );
}

function WrapAnimationOverlay({
  wrapAnimation,
  images,
  productName,
}: {
  wrapAnimation: "left" | "right";
  images: string[];
  productName: string;
}) {
  const wrapTargetIndex = wrapAnimation === "left" ? 0 : images.length - 1;
  return (
    <div
      className="absolute inset-0 z-20"
      style={{
        animation:
          wrapAnimation === "left"
            ? "slideFromRight 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards"
            : "slideFromLeft 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
      }}
    >
      <Image
        src={images[wrapTargetIndex]}
        alt={`${productName} - ${wrapTargetIndex + 1}`}
        fill
        sizes="calc(100vh - 80px)"
        quality={90}
        className="object-contain"
        priority
      />
    </div>
  );
}

function ImageCounter({
  currentIndex,
  totalImages,
  wrapAnimation,
}: {
  currentIndex: number;
  totalImages: number;
  wrapAnimation: "left" | "right" | null;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-text-primary/40 text-white text-sm font-medium font-manrope px-1.5 py-0.5 rounded-full">
      {wrapAnimation
        ? wrapAnimation === "left"
          ? `1/${totalImages}`
          : `${totalImages}/${totalImages}`
        : `${currentIndex + 1}/${totalImages}`}
    </div>
  );
}

const WRAP_KEYFRAMES = `
  @keyframes slideFromRight {
    from { transform: translateX(100%); opacity: 0.8; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideFromLeft {
    from { transform: translateX(-100%); opacity: 0.8; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

export function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  productName,
}: ImageModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useScrollLock(visible);

  const { scrollRef, handleScroll, goToPrevious, goToNext, wrapAnimation } = useImageCarousel({
    isOpen,
    visible,
    images,
    currentIndex,
    onIndexChange,
    onClose,
  });

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimate(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const rafId = requestAnimationFrame(() => setAnimate(false));
    const timeout = setTimeout(() => setVisible(false), 200);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-all duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {images.length > 1 && (
        <CarouselNavButtons animate={animate} onPrevious={goToPrevious} onNext={goToNext} />
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 rounded-lg p-2 bg-white/90 hover:bg-white text-zinc-600 transition-colors shadow-lg"
        style={{ opacity: animate ? 1 : 0 }}
        aria-label="Close modal"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="relative flex items-center justify-center transition-all duration-200 w-full h-full p-0 md:py-10 pointer-events-none"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/*
         * Wrapper exists to prevent clicks inside the image area from
         * dismissing the modal via the backdrop's onClick={onClose}.
         * Cannot become a <button> because it contains the carousel
         * track (which has its own interactive scroll) and counter.
         */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          className="relative w-full h-full md:w-auto md:aspect-square md:h-[calc(100vh-80px)] rounded-lg overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CarouselTrack
            scrollRef={scrollRef}
            onScroll={handleScroll}
            images={images}
            currentIndex={currentIndex}
            productName={productName}
            wrapAnimation={wrapAnimation}
          />

          {wrapAnimation && (
            <WrapAnimationOverlay
              wrapAnimation={wrapAnimation}
              images={images}
              productName={productName}
            />
          )}

          {images.length > 1 && (
            <ImageCounter
              currentIndex={currentIndex}
              totalImages={images.length}
              wrapAnimation={wrapAnimation}
            />
          )}
        </div>
      </div>

      <style jsx global>
        {WRAP_KEYFRAMES}
      </style>
    </div>,
    document.body,
  );
}
