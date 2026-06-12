"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { PartyPopper } from "@/components/svg/PartyPopper";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface ClearWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAnimationEnd?: () => void;
  isClearing?: boolean;
}

export const ClearWishlistModal = ({
  isOpen,
  onClose,
  onConfirm,
  onAnimationEnd,
  isClearing = false,
}: ClearWishlistModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => {
        setVisible(false);
        onAnimationEnd?.();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, onAnimationEnd, visible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isClearing) onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose, isClearing]);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={() => !isClearing && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 py-8 flex flex-col items-center gap-8 transition-all duration-200 mx-4"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-status-error-bg flex items-center justify-center">
          <PartyPopper />
        </div>

        {/* Text Content */}
        <p className="text-text-primary font-semibold text-xl font-manrope text-center leading-7">
          Wishlist -ийн бүх барааг устгах
          <br />
          гэж байна. Итгэлтэй байна уу.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? "Устгаж байна..." : "Устгах"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
