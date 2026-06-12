// Measures whether a multi-line description overflows the 2-line clamp on
// the product detail page. Returns the full unclamped height too, so the
// "Show more" expand animation can use it as a target.
//
// Pulled out of ProductDetailClient because the measuring logic involves
// cloning + reading computed styles — verbose enough to deserve its own file.

import { useLayoutEffect, useRef, useState } from "react";

export interface DescriptionOverflowState {
  ref: React.RefObject<HTMLDivElement | null>;
  overflows: boolean;
  fullHeight: number;
}

interface UseDescriptionOverflowArgs {
  // Re-measure whenever any of these change (description text, selected variant, etc.)
  deps: unknown[];
}

export function useDescriptionOverflow({
  deps,
}: UseDescriptionOverflowArgs): DescriptionOverflowState {
  const ref = useRef<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (!ref.current) return;

      // Clone the element to measure without constraints
      const clone = ref.current.cloneNode(true) as HTMLElement;
      const computedStyle = getComputedStyle(ref.current);

      // Use parent's width minus button width (70px + 4px gap) for accurate measurement
      const parentWidth = ref.current.parentElement?.offsetWidth ?? ref.current.offsetWidth;
      const measureWidth = parentWidth - 100; // 70px button + 4px gap + 4px buffer

      // Copy essential font/text styles for accurate measurement
      clone.style.cssText = `
        position: absolute;
        visibility: hidden;
        height: auto;
        max-height: none;
        overflow: visible;
        width: ${measureWidth}px;
        font-family: ${computedStyle.fontFamily};
        font-size: ${computedStyle.fontSize};
        font-weight: ${computedStyle.fontWeight};
        line-height: ${computedStyle.lineHeight};
        letter-spacing: ${computedStyle.letterSpacing};
        word-spacing: ${computedStyle.wordSpacing};
        white-space: ${computedStyle.whiteSpace};
        word-break: ${computedStyle.wordBreak};
        padding: ${computedStyle.padding};
      `;

      document.body.appendChild(clone);
      const measuredHeight = clone.scrollHeight;
      document.body.removeChild(clone);

      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const maxHeight = lineHeight * 2;
      setOverflows(measuredHeight > maxHeight + 1);
      setFullHeight(measuredHeight);
    };

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, overflows, fullHeight };
}
