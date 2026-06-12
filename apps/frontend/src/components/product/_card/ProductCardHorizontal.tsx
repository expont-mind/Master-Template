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

interface ProductCardHorizontalProps {
  product: Product;
  rank: number;
}

export function ProductCardHorizontal({ product, rank }: ProductCardHorizontalProps) {
  const { isModalOpen, setIsModalOpen, wishlisted, reviewSummary, handleToggleWishlist } =
    useProductCard(product);
  const outOfStock = isProductOutOfStock(product);
  const discount = getDiscountPercentage(product.price, product.discount_price);

  return (
    <div className="flex gap-4 w-[344px] shrink-0">
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="relative w-[108px] h-[162px] rounded-sm bg-black/6 overflow-hidden shrink-0 block"
      >
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="108px"
            quality={90}
          />
        )}
        <WishlistButton wishlisted={wishlisted} onToggle={handleToggleWishlist} />
      </Link>
      <div className="flex flex-col justify-between self-stretch flex-1 min-w-0">
        <Link href={ROUTES.PRODUCT(product.slug)} className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <span className="text-text-primary font-bold text-[30px] font-manrope leading-9">
              {rank}
            </span>
            <RatingBlock
              averageRating={reviewSummary?.averageRating}
              totalCount={reviewSummary?.totalCount}
              size="xs"
            />
          </div>
          <p className="text-text-primary font-medium text-base font-manrope leading-6">
            {product.name}
          </p>
          <div className="flex flex-col">
            {discount && (
              <p className="text-text-secondary font-normal text-xs font-manrope line-through">
                {formatPrice(product.price)}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {discount && (
                <span className="text-brand-primary font-semibold text-sm font-manrope">
                  {discount}%
                </span>
              )}
              <span className="text-text-primary font-semibold text-sm font-manrope">
                {formatPrice(getDisplayPrice(product.price, product.discount_price))}
              </span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          className={`w-full h-9 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors ${
            outOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-surface"
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={outOfStock}
        >
          <ShoppingCartSmall />
          <span className="text-text-primary font-normal text-sm font-manrope">
            {outOfStock ? "Дууссан" : "Сагслах"}
          </span>
        </button>
        <AddToCartModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
        />
      </div>
    </div>
  );
}
