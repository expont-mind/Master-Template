"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { CategoryWithChildren } from "@/lib/queries/products";

interface UseMobileCategoryStateArgs {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWithChildren[];
}

export function useMobileCategoryState({
  isOpen,
  onClose,
  categories,
}: UseMobileCategoryStateArgs) {
  const pathname = usePathname();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const rightColumnRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Select first category by default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      // Intentional one-time default selection when categories arrive.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      // Intentional sync: mount before the entry animation runs in next RAFs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setSelectedCategoryId(categories[0]?.id || null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, categories]);

  // Close menu when pathname changes (navigation). Intentionally watches only
  // pathname so re-opening the menu mid-navigation isn't fought by this effect.
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    // Scroll to the category in right column
    const categoryElement = categoryRefs.current.get(categoryId);
    if (categoryElement && rightColumnRef.current) {
      const containerTop = rightColumnRef.current.getBoundingClientRect().top;
      const elementTop = categoryElement.getBoundingClientRect().top;
      const scrollOffset = elementTop - containerTop + rightColumnRef.current.scrollTop;

      rightColumnRef.current.scrollTo({
        top: scrollOffset - 8, // Small offset for better visibility
        behavior: "smooth",
      });
    }
  };

  return {
    selectedCategoryId,
    isVisible,
    isAnimating,
    rightColumnRef,
    categoryRefs,
    handleCategoryClick,
  };
}
