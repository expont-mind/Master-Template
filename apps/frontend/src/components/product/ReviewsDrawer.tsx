"use client";

import { SITE } from "@repo/config-site";
import { useEffect } from "react";

import { Cancel } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { Reviews } from "./Reviews";

interface ReviewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productDescription?: string | null;
  productImage?: string | null;
}

// Wrapper/inner split: when reviews are disabled the drawer (which stays
// mounted off-screen on every product page) never renders or runs hooks.
export const ReviewsDrawer = (props: ReviewsDrawerProps) => {
  if (!SITE.features.reviews) return null;
  return <ReviewsDrawerInner {...props} />;
};

const ReviewsDrawerInner = ({
  isOpen,
  onClose,
  productId,
  productName,
  productDescription,
  productImage,
}: ReviewsDrawerProps) => {
  useScrollLock(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed top-[44px] left-0 right-0 bottom-0 bg-white z-100 flex flex-col md:hidden transition-transform duration-300 ease-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5 border-b border-border">
        <h2 className="text-2xl font-bold text-text-primary font-manrope">
          Үнэлгээ ба сэтгэгдлүүд
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-border-light rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <Cancel />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4">
        <Reviews
          productId={productId}
          productName={productName}
          productDescription={productDescription}
          productImage={productImage}
          reviewsOnly
        />
      </div>
    </div>
  );
};
