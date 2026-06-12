"use client";

import { useEffect, useState } from "react";

/**
 * Two-stage open animation: when `isOpen` flips true, we mount the modal
 * (`visible=true`) then on the next frame flip `animate=true` so CSS
 * transitions can run. On close, we flip `animate=false` immediately,
 * then unmount after the 200ms transition.
 *
 * Also wires the Escape key to call `onClose` while visible.
 */
export function useModalOpenAnimation(isOpen: boolean, onClose: () => void) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimate(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const rafId = requestAnimationFrame(() => setAnimate(false));
    const timeout = setTimeout(() => setVisible(false), 200);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  return { visible, animate };
}
