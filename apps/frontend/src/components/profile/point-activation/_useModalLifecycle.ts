"use client";

import { useEffect, useState } from "react";

interface UseModalLifecycleResult {
  visible: boolean;
  animate: boolean;
}

/**
 * Coordinates the mount/visible/exit animation for the point activation
 * modal. `visible` controls whether the portal renders at all; `animate`
 * drives the open transition.
 */
export function useModalLifecycle(
  isOpen: boolean,
  onResetDrag: () => void,
  closeDelayMs = 500,
): UseModalLifecycleResult {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal enter animation: mount + reset drag state, then double-RAF before applying transition
      setVisible(true);
      onResetDrag();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
      return;
    }
    if (!visible) return;
    setAnimate(false);
    const timeout = setTimeout(() => {
      setVisible(false);
      onResetDrag();
    }, closeDelayMs);
    return () => clearTimeout(timeout);
  }, [isOpen, visible, onResetDrag, closeDelayMs]);

  return { visible, animate };
}

/**
 * Adds an Escape-key listener while `enabled` is true, invoking `onEscape`.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    if (enabled) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enabled, onEscape]);
}
