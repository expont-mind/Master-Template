// Section scroll-spy for the product detail tabs. Watches which of three
// sections (brief, details, reviews) is in view and updates activeTab.
// Also provides a `scrollToSection` for click-driven navigation.
//
// Uses an `isScrollingRef` guard so click-initiated scrolls don't fight the
// IntersectionObserver (which would briefly snap activeTab to whichever
// section the scroll passes through).

import { useEffect, useRef, useState } from "react";

import type { RefObject } from "react";

export type ProductDetailSection = "brief" | "details" | "reviews";

interface UseProductScrollSpyArgs {
  briefRef: RefObject<HTMLElement | null>;
  detailsRef: RefObject<HTMLElement | null>;
  reviewsRef: RefObject<HTMLElement | null>;
  tabsRef: RefObject<HTMLElement | null>;
  defaultTab?: ProductDetailSection;
  // Recompute observer when this changes (e.g., on product navigation).
  resetKey?: unknown;
}

export function useProductScrollSpy({
  briefRef,
  detailsRef,
  reviewsRef,
  tabsRef,
  defaultTab = "brief",
  resetKey,
}: UseProductScrollSpyArgs) {
  const [activeTab, setActiveTab] = useState<ProductDetailSection>(defaultTab);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const sections = [
      { ref: briefRef, tab: "brief" as const },
      { ref: detailsRef, tab: "details" as const },
      { ref: reviewsRef, tab: "reviews" as const },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sections.find((s) => s.ref.current === entry.target);
            if (match) setActiveTab(match.tab);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );

    for (const { ref } of sections) {
      if (ref.current) observer.observe(ref.current);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const scrollToSection = (tab: ProductDetailSection) => {
    setActiveTab(tab);
    isScrollingRef.current = true;
    const ref = tab === "brief" ? briefRef : tab === "details" ? detailsRef : reviewsRef;
    const el = ref.current;
    if (el) {
      const tabsHeight = tabsRef.current?.offsetHeight ?? 42;
      const top = el.getBoundingClientRect().top + window.scrollY - 70 - tabsHeight;
      window.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  return { activeTab, setActiveTab, scrollToSection };
}
