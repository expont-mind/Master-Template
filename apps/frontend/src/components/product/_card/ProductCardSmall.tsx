"use client";

import Image from "next/image";
import Link from "next/link";

import { AddToCartModal } from "@/components/product/AddToCartModal";
import { ShoppingCartSmall } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";

import { getDisplayPrice, isProductOutOfStock, RatingBlock, WishlistButton } from "./_shared";
import { useProductCard } from "./_useProductCard";

import type { Product } from "@/types/database";

export function ProductCardSmall({ product }: { product: Product }) {
  const { isModalOpen, setIsModalOpen, wishlisted, reviewSummary, handleToggleWishlist } =
    useProductCard(product);
  const outOfStock = isProductOutOfStock(product);
  const discount = getDiscountPercentage(product.price, product.discount_price);
  const hasValidDiscount =
    product.discount_price != null &&
    product.discount_price > 0 &&
    product.discount_price < product.price;

  return (
    <div className="flex flex-col gap-[6px] w-[160px] shrink-0">
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="relative w-[160px] h-[160px] rounded-sm bg-black/6 overflow-hidden block"
      >
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="160px"
            quality={90}
          />
        )}
        <WishlistButton wishlisted={wishlisted} onToggle={handleToggleWishlist} />
      </Link>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={`w-full h-8 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors ${
            outOfStock ? "cursor-not-allowed bg-text-primary/30" : "cursor-pointer hover:bg-surface"
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={outOfStock}
        >
          <ShoppingCartSmall />
          <span className="text-text-primary font-normal text-xs font-manrope">
            {outOfStock ? "Дууссан" : "Сагслах"}
          </span>
        </button>
        <AddToCartModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
        />
        <Link href={ROUTES.PRODUCT(product.slug)} className="flex flex-col gap-2">
          <p className="text-text-primary font-medium text-sm font-manrope line-clamp-2 leading-[18px]">
            {product.name}
          </p>
          <div className="flex flex-col">
            {hasValidDiscount && (
              <p className="text-text-secondary font-normal text-xs font-manrope line-through">
                {formatPrice(product.price)}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {hasValidDiscount && discount && (
                <span className="text-brand-primary font-semibold text-base font-manrope tracking-[-0.64px]">
                  {discount}%
                </span>
              )}
              <span className="text-text-primary font-semibold text-base font-manrope tracking-[-0.64px]">
                {formatPrice(getDisplayPrice(product.price, product.discount_price))}
              </span>
            </div>
          </div>
          <RatingBlock
            averageRating={reviewSummary?.averageRating}
            totalCount={reviewSummary?.totalCount}
            size="xs"
          />
        </Link>
      </div>
    </div>
  );
}
