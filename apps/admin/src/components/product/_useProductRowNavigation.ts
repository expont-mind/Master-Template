"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import type { Product } from "./types";

/**
 * Single-click navigates after a 300ms delay; double-click opens new tab.
 * The delay lets a double-click cancel the pending single-click navigation.
 */
export function useProductRowNavigation() {
  const router = useRouter();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowClick = useCallback(
    (row: Product) => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      clickTimer.current = setTimeout(() => {
        router.push(`/products/${row.id}`);
      }, 300);
    },
    [router],
  );

  const handleRowDoubleClick = useCallback((row: Product) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    window.open(`/products/${row.id}`, "_blank");
  }, []);

  return { handleRowClick, handleRowDoubleClick };
}
