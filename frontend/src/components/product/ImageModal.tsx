"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import Image from "next/image";
import { X } from "lucide-react";
import { ChevronLeftBig, ChevronRightBig } from "../svg";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
}

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
  const [wrapAnimation, setWrapAnimation] = useState<"left" | "right" | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useScrollLock(visible);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrollingRef.current || wrapAnimation) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      onIndexChange(index);
    }
  }, [currentIndex, images.length, onIndexChange, wrapAnimation]);

  const scrollToImage = useCallback((index: number, smooth: boolean = true) => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: index * width,
      behavior: smooth ? "smooth" : "instant",
    });
    setTimeout(
      () => {
        isScrollingRef.current = false;
      },
      smooth ? 300 : 50,
    );
  }, []);

  const goToPrevious = useCallback(() => {
    if (wrapAnimation) return;
    const isWrapping = currentIndex === 0;
    const newIndex = isWrapping ? images.length - 1 : currentIndex - 1;

    if (isWrapping) {
      // Animate wrap-around: slide from left
      setWrapAnimation("right");
      setTimeout(() => {
        onIndexChange(newIndex);
        if (scrollRef.current) {
          const width = scrollRef.current.clientWidth;
          scrollRef.current.scrollLeft = newIndex * width;
        }
        setWrapAnimation(null);
      }, 350);
    } else {
      onIndexChange(newIndex);
      scrollToImage(newIndex, true);
    }
  }, [
    currentIndex,
    images.length,
    onIndexChange,
    scrollToImage,
    wrapAnimation,
  ]);

  const goToNext = useCallback(() => {
    if (wrapAnimation) return;
    const isWrapping = currentIndex === images.length - 1;
    const newIndex = isWrapping ? 0 : currentIndex + 1;

    if (isWrapping) {
      // Animate wrap-around: slide from right
      setWrapAnimation("left");
      setTimeout(() => {
        onIndexChange(newIndex);
        if (scrollRef.current) {
          const width = scrollRef.current.clientWidth;
          scrollRef.current.scrollLeft = newIndex * width;
        }
        setWrapAnimation(null);
      }, 350);
    } else {
      onIndexChange(newIndex);
      scrollToImage(newIndex, true);
    }
  }, [
    currentIndex,
    images.length,
    onIndexChange,
    scrollToImage,
    wrapAnimation,
  ]);

  // Scroll to current image when modal opens or index changes externally
  useEffect(() => {
    if (
      visible &&
      scrollRef.current &&
      !isScrollingRef.current &&
      !wrapAnimation
    ) {
      const width = scrollRef.current.clientWidth;
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = currentIndex * width;
      if (Math.abs(currentScroll - targetScroll) > 10) {
        scrollRef.current.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [visible, currentIndex, wrapAnimation]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          // Initial scroll to current image
          if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            scrollRef.current.scrollLeft = currentIndex * width;
          }
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Handle keyboard navigation and body scroll
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onClose, goToPrevious, goToNext]);

  if (!visible || typeof window === "undefined") return null;

  // Get the wrap target image for animation
  const wrapTargetIndex =
    wrapAnimation === "left"
      ? 0
      : wrapAnimation === "right"
        ? images.length - 1
        : null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-all duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 z-10 w-14 h-14 flex items-center justify-center bg-[rgba(2,6,23,0.10)] hover:bg-[rgba(2,6,23,0.20)] rounded-lg transition-all duration-200 cursor-pointer"
            style={{ opacity: animate ? 1 : 0 }}
            aria-label="Previous image"
          >
            <ChevronLeftBig />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 z-10 w-14 h-14 flex items-center justify-center bg-[rgba(2,6,23,0.10)] hover:bg-[rgba(2,6,23,0.20)] rounded-lg transition-all duration-200 cursor-pointer"
            style={{ opacity: animate ? 1 : 0 }}
            aria-label="Next image"
          >
            <ChevronRightBig />
          </button>
        </>
      )}

      {/* Close Button - positioned relative to viewport */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 rounded-lg p-2 bg-white/90 hover:bg-white text-zinc-600 transition-colors shadow-lg"
        style={{ opacity: animate ? 1 : 0 }}
        aria-label="Close modal"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image Container */}
      <div
        className="relative flex items-center justify-center transition-all duration-200 w-full h-full p-0 md:py-10 pointer-events-none"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        <div
          className="relative w-full h-full md:w-auto md:aspect-square md:h-[calc(100vh-80px)] rounded-lg overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Image Container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollSnapType: wrapAnimation ? "none" : "x mandatory",
              transform: wrapAnimation
                ? wrapAnimation === "left"
                  ? "translateX(-100%)"
                  : "translateX(100%)"
                : "translateX(0)",
              transition: wrapAnimation
                ? "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)"
                : "none",
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="shrink-0 w-full h-full snap-center relative"
              >
                <Image
                  src={image}
                  alt={`${productName} - ${index + 1}`}
                  fill
                  sizes="calc(100vh - 80px)"
                  quality={75}
                  className="object-contain"
                  priority={index === currentIndex}
                />
              </div>
            ))}
          </div>

          {/* Wrap animation overlay - shows incoming image */}
          {wrapAnimation && wrapTargetIndex !== null && (
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
                quality={75}
                className="object-contain"
                priority
              />
            </div>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[rgba(2,6,23,0.40)] text-white text-sm font-medium font-manrope px-1.5 py-0.5 rounded-full">
              {wrapAnimation
                ? wrapAnimation === "left"
                  ? `1/${images.length}`
                  : `${images.length}/${images.length}`
                : `${currentIndex + 1}/${images.length}`}
            </div>
          )}
        </div>
      </div>

      {/* Wrap Animation Styles */}
      <style jsx global>{`
        @keyframes slideFromRight {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}
