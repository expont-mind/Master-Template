"use client";

import { useEffect, useRef } from "react";

export function useHideOnScroll(setShowTopHeader: (show: boolean) => void) {
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setShowTopHeader(false);
      } else {
        setShowTopHeader(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // setShowTopHeader is React-stable; including it makes the linter happy.
  }, [setShowTopHeader]);
}
