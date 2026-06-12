"use client";

import { AddToCartButtons } from "./AddToCartButtons";

interface ProductDetailMobileBarProps {
  wishlisted: boolean;
  cartDisabled: boolean;
  currentStock: number;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
}

/**
 * Fixed bottom bar shown on mobile only. Uses translateZ tricks so
 * iOS Safari doesn't shift the bar when the keyboard opens or when
 * the address bar collapses.
 */
export function ProductDetailMobileBar({
  wishlisted,
  cartDisabled,
  currentStock,
  onToggleWishlist,
  onAddToCart,
}: ProductDetailMobileBarProps) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border px-4 py-3"
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      <div className="flex gap-3 items-center">
        <AddToCartButtons
          wishlisted={wishlisted}
          cartDisabled={cartDisabled}
          currentStock={currentStock}
          onToggleWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
          size="mobile"
        />
      </div>
    </div>
  );
}
