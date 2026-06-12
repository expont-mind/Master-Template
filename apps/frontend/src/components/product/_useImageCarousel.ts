"use client";

// Carousel state + handlers for ImageModal: scroll snap tracking,
// previous/next navigation (with wrap-around animation), and keyboard
// nav. Receives the controlling state via the props block.

import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageCarouselInput {
  isOpen: boolean;
  visible: boolean;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function useImageCarousel({
  isOpen,
  visible,
  images,
  currentIndex,
  onIndexChange,
  onClose,
}: UseImageCarouselInput) {
  const [wrapAnimation, setWrapAnimation] = useState<"left" | "right" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

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

  const goToWrappedIndex = useCallback(
    (direction: "left" | "right", newIndex: number) => {
      setWrapAnimation(direction);
      setTimeout(() => {
        onIndexChange(newIndex);
        if (scrollRef.current) {
          const width = scrollRef.current.clientWidth;
          scrollRef.current.scrollLeft = newIndex * width;
        }
        setWrapAnimation(null);
      }, 350);
    },
    [onIndexChange],
  );

  const goToPrevious = useCallback(() => {
    if (wrapAnimation) return;
    const isWrapping = currentIndex === 0;
    const newIndex = isWrapping ? images.length - 1 : currentIndex - 1;
    if (isWrapping) {
      goToWrappedIndex("right", newIndex);
    } else {
      onIndexChange(newIndex);
      scrollToImage(newIndex, true);
    }
  }, [currentIndex, images.length, onIndexChange, scrollToImage, wrapAnimation, goToWrappedIndex]);

  const goToNext = useCallback(() => {
    if (wrapAnimation) return;
    const isWrapping = currentIndex === images.length - 1;
    const newIndex = isWrapping ? 0 : currentIndex + 1;
    if (isWrapping) {
      goToWrappedIndex("left", newIndex);
    } else {
      onIndexChange(newIndex);
      scrollToImage(newIndex, true);
    }
  }, [currentIndex, images.length, onIndexChange, scrollToImage, wrapAnimation, goToWrappedIndex]);

  // Sync scroll position to currentIndex when changed externally
  useEffect(() => {
    if (visible && scrollRef.current && !isScrollingRef.current && !wrapAnimation) {
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

  // Set initial scroll when modal opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            scrollRef.current.scrollLeft = currentIndex * width;
          }
        });
      });
    }
    // currentIndex intentionally excluded: opening the modal resets it to
    // initial slide; tracking subsequent changes would re-trigger animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose, goToPrevious, goToNext]);

  return {
    scrollRef,
    handleScroll,
    goToPrevious,
    goToNext,
    wrapAnimation,
  };
}
