"use client";

import { useEffect, useRef, useState } from "react";

export function useCategoryDropdown(headerRef: React.RefObject<HTMLDivElement | null>) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryOpen, headerRef]);

  return { isCategoryOpen, setIsCategoryOpen, closeTimeoutRef };
}
