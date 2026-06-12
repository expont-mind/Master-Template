"use client";

import { useEffect, useState } from "react";

export function useResponsiveLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [slideWidth, setSlideWidth] = useState(0);
  const [gap, setGap] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      const vw = containerRef.current.clientWidth;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        const mobileGap = 12;
        const sidePeek = 20;
        setSlideWidth(vw - sidePeek * 2 - mobileGap);
        setGap(mobileGap);
      } else {
        setSlideWidth(vw);
        setGap(0);
      }
    };
    updateWidth();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [containerRef]);

  return { slideWidth, gap, isReady, isMobile };
}
