"use client";

import { Heart, ShoppingCartProduct } from "@/components/svg";

interface AddToCartButtonsProps {
  wishlisted: boolean;
  cartDisabled: boolean;
  currentStock: number;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  /** Larger sizing for the floating mobile bottom bar. */
  size?: "desktop" | "mobile";
}

/**
 * Wishlist heart + add-to-cart CTA, used in both the desktop right
 * panel (size="desktop") and the mobile floating bottom bar
 * (size="mobile"). Label flips to "Дууссан" when out of stock.
 */
export function AddToCartButtons({
  wishlisted,
  cartDisabled,
  currentStock,
  onToggleWishlist,
  onAddToCart,
  size = "desktop",
}: AddToCartButtonsProps) {
  const isMobile = size === "mobile";
  const heartSize = isMobile ? "w-14 h-14" : "w-11 h-11";
  const cartButtonSize = isMobile ? "px-3 py-3.5 text-lg" : "px-3 py-2.5 text-base";

  return (
    <>
      <button
        className={`${heartSize} flex items-center justify-center rounded-sm cursor-pointer shrink-0`}
        onClick={onToggleWishlist}
      >
        <Heart filled={wishlisted} />
      </button>
      <button
        className={`flex-1 ${cartButtonSize} rounded-sm text-white font-normal transition-colors flex items-center justify-center gap-0.5 ${!cartDisabled ? "bg-text-primary hover:bg-surface-dark cursor-pointer" : "bg-text-primary/30 cursor-not-allowed"}`}
        onClick={onAddToCart}
        disabled={cartDisabled}
      >
        <ShoppingCartProduct />
        <span className="px-0.5">{currentStock <= 0 ? "Дууссан" : "Сагслах"}</span>
      </button>
    </>
  );
}
