"use client";

import { SITE } from "@repo/config-site";

import { HeartProduct, ShoppingCartSmall, Star } from "@/components/svg";

import type { Product } from "@/types/database";

export function getDisplayPrice(price: number, discountPrice: number | null | undefined): number {
  const hasValidDiscount = discountPrice != null && discountPrice > 0 && discountPrice < price;
  return hasValidDiscount ? discountPrice : price;
}

export function isProductOutOfStock(product: Product | undefined): boolean {
  return !product || product.stock_quantity <= 0;
}

interface WishlistButtonProps {
  wishlisted: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function WishlistButton({ wishlisted, onToggle }: WishlistButtonProps) {
  if (!SITE.features.wishlist) return null;
  return (
    <button
      type="button"
      className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 flex items-start justify-end pr-1.5 pt-1.5 sm:pr-2 sm:pt-2 cursor-pointer"
      aria-label="Хадгалах"
      onClick={onToggle}
    >
      <HeartProduct filled={wishlisted} />
    </button>
  );
}

interface CartCtaButtonProps {
  outOfStock: boolean;
  onClick: () => void;
  className: string;
  textClassName: string;
}

export function CartCtaButton({
  outOfStock,
  onClick,
  className,
  textClassName,
}: CartCtaButtonProps) {
  return (
    <button type="button" className={className} onClick={onClick} disabled={outOfStock}>
      <ShoppingCartSmall />
      <span className={textClassName}>{outOfStock ? "Дууссан" : "Сагслах"}</span>
    </button>
  );
}

interface RatingBlockProps {
  averageRating: number | null | undefined;
  totalCount?: number | null;
  size: "sm" | "xs";
}

export function RatingBlock({ averageRating, totalCount, size }: RatingBlockProps) {
  if (!SITE.features.reviews) return null;
  if (!averageRating) return null;
  const sizeClass = size === "sm" ? "text-xs" : "text-[10px]";
  return (
    <div className="flex items-center gap-0.5">
      <Star />
      <span className={`text-text-secondary font-normal ${sizeClass} font-manrope`}>
        {averageRating}
      </span>
      <span className={`text-text-muted font-normal ${sizeClass} font-manrope`}>
        ({totalCount ?? 0})
      </span>
    </div>
  );
}
