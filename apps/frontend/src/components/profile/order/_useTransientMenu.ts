"use client";

import { useEffect, useRef, useState } from "react";

interface UseTransientMenuResult {
  isMenuOpen: boolean;
  setIsMenuOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  menuMounted: boolean;
  menuVisible: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Three-state menu (intent, mounted, visible) so an exit transition can
 * play before unmount. Also wires up click-outside dismissal.
 *
 * Shared by OrderCard and OrderDetailView — both use the same 150 ms
 * double-rAF pattern.
 */
export function useTransientMenu(transitionMs = 150): UseTransientMenuResult {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMenuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuMounted(true);
      // Double-rAF: ensures the element is painted in its initial state
      // before the visible class is applied, so the transition actually fires.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setMenuVisible(false);
    const timer = setTimeout(() => setMenuMounted(false), transitionMs);
    return () => clearTimeout(timer);
  }, [isMenuOpen, transitionMs]);

  useEffect(() => {
    if (!menuMounted) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuMounted]);

  return { isMenuOpen, setIsMenuOpen, menuMounted, menuVisible, menuRef };
}
