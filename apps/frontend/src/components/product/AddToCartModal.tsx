"use client";

// Composes the add-to-cart bottom-sheet (mobile) / success modal (desktop).
//
// State lives in useAddToCartState. Drag-to-dismiss state lives in
// useDragToDismiss. The mobile shell + the three mobile render paths
// (accordion/summary/success) live in their own files.
//
// This file orchestrates: mobile detection, animation timing (visible/animate),
// ESC-to-close, and the desktop vs. mobile portal split.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { useAddToCartState } from "./add-to-cart/_useAddToCartState";
import { useDragToDismiss } from "./add-to-cart/_useDragToDismiss";
import { AddToCartDesktopSuccess } from "./add-to-cart/AddToCartDesktopSuccess";
import { AddToCartMobileShell } from "./add-to-cart/AddToCartMobileShell";

import type { ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithDetails;
  quantity?: number;
  variant?: ProductVariant | null;
}

export const AddToCartModal = ({
  isOpen,
  onClose,
  product,
  quantity: initialQuantity = 1,
  variant: initialVariant = null,
}: AddToCartModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const state = useAddToCartState({
    isOpen,
    isMobile,
    product,
    initialQuantity,
    initialVariant,
  });

  const { dragY, isDragging, drawerTouchProps } = useDragToDismiss({ onClose });

  useScrollLock(visible);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Open/close animation gate
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal enter animation: mount, then double-RAF before applying transition
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // ESC-to-close
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

  // Shared drawer style with drag support
  const getDrawerStyle = (extraTransform?: string): React.CSSProperties => ({
    transform: isDragging
      ? `translateY(${dragY}px)`
      : animate
        ? (extraTransform ?? "translateY(0)")
        : "translateY(100%)",
    transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform",
  });

  if (!visible || typeof window === "undefined") return null;

  if (isMobile) {
    return createPortal(
      <AddToCartMobileShell
        state={state}
        onClose={onClose}
        animate={animate}
        isDragging={isDragging}
        dragY={dragY}
        drawerTouchProps={drawerTouchProps}
        getDrawerStyle={getDrawerStyle}
      />,
      document.body,
    );
  }

  // Desktop "Added to cart" success modal — extracted to AddToCartDesktopSuccess.
  return createPortal(
    <AddToCartDesktopSuccess
      animate={animate}
      onClose={onClose}
      displayImage={state.displayImage}
      displayName={state.displayName}
      sku={state.selectedVariant?.sku || state.resolvedProduct.sku}
      currentPrice={state.currentPrice}
      currentDiscountPrice={state.currentDiscountPrice}
      discount={state.discount}
      sellingPrice={state.sellingPrice}
    />,
    document.body,
  );
};
