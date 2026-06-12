"use client";

import { useEffect } from "react";

/**
 * Closes any open dropdown when the user clicks outside the element marked
 * with `[data-dropdown]`. Shared between AddressContent and any other
 * profile-side list with per-row dropdowns.
 */
export function useDropdownClickAway(selector: string, onClickAway: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(selector)) {
        onClickAway();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selector, onClickAway]);
}
