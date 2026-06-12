// Computes the right-panel sticky-top offset so the panel scrolls together
// with the main content and "lands" when both bottoms align — instead of the
// default "stick at top of viewport forever" behavior.
//
// Listens to both ResizeObserver (content height changes) and window resize.

import { useEffect, useState } from "react";

import type { RefObject } from "react";

interface UseStickyPanelPositionArgs {
  panelRef: RefObject<HTMLElement | null>;
  defaultTop?: number;
  bottomPadding?: number;
  // Recompute when these deps change (e.g., panel content varies).
  deps?: unknown[];
}

export function useStickyPanelPosition({
  panelRef,
  defaultTop = 140,
  bottomPadding = 20,
  deps = [],
}: UseStickyPanelPositionArgs): number {
  const [stickyTop, setStickyTop] = useState(defaultTop);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const calculate = () => {
      const panelHeight = el.offsetHeight;
      const viewportHeight = window.innerHeight;
      setStickyTop(Math.min(defaultTop, viewportHeight - panelHeight - bottomPadding));
    };

    calculate();

    const resizeObserver = new ResizeObserver(calculate);
    resizeObserver.observe(el);
    window.addEventListener("resize", calculate);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return stickyTop;
}
