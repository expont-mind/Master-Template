"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCartSmall, Star, HeartProduct } from "../svg";
import { AddToCartModal } from "./AddToCartModal";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";
import { ROUTES } from "@/lib/utils/constants";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUIStore } from "@/stores/ui-store";
import { useReviewSummary } from "@/lib/hooks/useReviews";
import type { Product } from "@/types/database";

interface ProductCardBaseProps {
  product?: Product;
}

interface DefaultVariantProps extends ProductCardBaseProps {
  variant?: "default";
  rank?: number;
  imageHeight?: number;
  fillParent?: boolean;
  compactImage?: boolean;
}

interface SmallVariantProps extends ProductCardBaseProps {
  variant: "small";
  product: Product;
}

interface HorizontalVariantProps extends ProductCardBaseProps {
  variant: "horizontal";
  product: Product;
  rank: number;
}

type ProductCardProps =
  | DefaultVariantProps
  | SmallVariantProps
  | HorizontalVariantProps;

export const ProductCard = (props: ProductCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredImageIndex, setHoveredImageIndex] = useState(0);
  const variant = props.variant ?? "default";
  const product = props.product;
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const userId = useWishlistStore((s) => s.userId);
  const openLogin = useUIStore((s) => s.openLogin);
  const wishlisted = useWishlistStore(
    (s) =>
      s.isHydrated &&
      !!product &&
      s.items.some((item) => item.id === product.id),
  );
  const { data: reviewSummary } = useReviewSummary(product?.id ?? "");

  const discount = product
    ? getDiscountPercentage(product.price, product.discount_price)
    : null;

  // Helper: determine actual display price
  const getDisplayPrice = (
    price: number,
    discountPrice: number | null | undefined,
  ) => {
    const hasValidDiscount =
      discountPrice != null && discountPrice > 0 && discountPrice < price;
    return hasValidDiscount ? discountPrice : price;
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    if (!userId) {
      openLogin();
      return;
    }
    toggleWishlist(product);
  };

  const wishlistButton = (
    <button
      className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 flex items-start justify-end pr-1.5 pt-1.5 sm:pr-2 sm:pt-2 cursor-pointer"
      aria-label="Хадгалах"
      onClick={handleToggleWishlist}
    >
      <HeartProduct filled={wishlisted} />
    </button>
  );

  const outOfStock = !product || product.stock_quantity <= 0;

  const cartButton = (
    <button
      className={`h-8 sm:h-9 px-2 sm:px-3 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors min-h-[36px] sm:min-h-0 ${outOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-surface"}`}
      onClick={() => setIsModalOpen(true)}
      disabled={outOfStock}
    >
      <ShoppingCartSmall />
      <span className="text-primary font-normal text-xs sm:text-sm font-manrope">
        {outOfStock ? "Дууссан" : "Сагслах"}
      </span>
    </button>
  );

  const cartModal = product ? (
    <AddToCartModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      product={product}
    />
  ) : null;

  const priceBlock = (
    originalPrice: number,
    discountPrice: number | null | undefined,
  ) => {
    const hasValidDiscount =
      discountPrice != null &&
      discountPrice > 0 &&
      discountPrice < originalPrice;
    return (
      <div className="flex flex-col">
        {hasValidDiscount && (
          <p className="text-text-secondary font-normal text-xs font-manrope line-through">
            {formatPrice(originalPrice)}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          {hasValidDiscount && discount && (
            <span className="text-accent-rose font-semibold text-base font-manrope tracking-[-0.64px]">
              {discount}%
            </span>
          )}
          <span className="text-text-primary font-semibold text-base font-manrope tracking-[-0.64px]">
            {formatPrice(getDisplayPrice(originalPrice, discountPrice))}
          </span>
        </div>
      </div>
    );
  };

  const ratingBlock = (size: "sm" | "xs" = "xs") => {
    if (!reviewSummary?.averageRating) return null;
    return (
      <div className="flex items-center gap-0.5">
        <Star />
        <span
          className={`text-text-secondary font-normal ${size === "sm" ? "text-xs" : "text-[10px]"} font-manrope`}
        >
          {reviewSummary.averageRating}
        </span>
        <span
          className={`text-text-muted font-normal ${size === "sm" ? "text-xs" : "text-[10px]"} font-manrope`}
        >
          ({reviewSummary.totalCount ?? 0})
        </span>
      </div>
    );
  };

  // --- Small variant ---
  if (variant === "small" && product) {
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
              quality={75}
            />
          )}
          {wishlistButton}
        </Link>
        <div className="flex flex-col gap-2">
          <button
            className={`w-full h-8 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors ${outOfStock ? "cursor-not-allowed bg-[rgba(2,6,23,0.30)]" : "cursor-pointer hover:bg-surface"}`}
            onClick={() => setIsModalOpen(true)}
            disabled={outOfStock}
          >
            <ShoppingCartSmall />
            <span className="text-text-primary font-normal text-xs font-manrope">
              {outOfStock ? "Дууссан" : "Сагслах"}
            </span>
          </button>
          {cartModal}
          <Link
            href={ROUTES.PRODUCT(product.slug)}
            className="flex flex-col gap-2"
          >
            <p className="text-text-primary font-medium text-sm font-manrope line-clamp-2 leading-[18px]">
              {product.name}
            </p>
            {priceBlock(product.price, product.discount_price)}
            {ratingBlock("xs")}
          </Link>
        </div>
      </div>
    );
  }

  // --- Horizontal variant ---
  if (variant === "horizontal" && product && "rank" in props) {
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
              quality={75}
            />
          )}
          {wishlistButton}
        </Link>
        <div className="flex flex-col justify-between self-stretch flex-1 min-w-0">
          <Link
            href={ROUTES.PRODUCT(product.slug)}
            className="flex flex-col gap-1"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-text-primary font-bold text-[30px] font-manrope leading-9">
                {props.rank}
              </span>
              {reviewSummary?.averageRating ? (
                <div className="flex items-center gap-0.5">
                  <Star />
                  <span className="text-text-secondary font-normal text-xs font-manrope">
                    {reviewSummary.averageRating}
                  </span>
                </div>
              ) : null}
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
                  <span className="text-accent-rose font-semibold text-sm font-manrope">
                    {discount}%
                  </span>
                )}
                <span className="text-text-primary font-semibold text-sm font-manrope">
                  {formatPrice(
                    getDisplayPrice(product.price, product.discount_price),
                  )}
                </span>
              </div>
            </div>
          </Link>
          <button
            className={`w-full h-9 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors ${outOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-surface"}`}
            onClick={() => setIsModalOpen(true)}
            disabled={outOfStock}
          >
            <ShoppingCartSmall />
            <span className="text-text-primary font-normal text-sm font-manrope">
              {outOfStock ? "Дууссан" : "Сагслах"}
            </span>
          </button>
          {cartModal}
        </div>
      </div>
    );
  }

  // --- Default variant ---
  const productHref = product ? ROUTES.PRODUCT(product.slug) : "#";

  const imageH =
    variant === "default" && "imageHeight" in props && props.imageHeight
      ? props.imageHeight
      : undefined;

  const fillParent =
    variant === "default" && "fillParent" in props && props.fillParent;

  const compactImage =
    variant === "default" && "compactImage" in props && props.compactImage;

  return (
    <div
      className={`flex flex-col gap-2 sm:gap-2.5 ${fillParent ? "w-full" : "w-[176px] sm:w-[254px] shrink-0"}`}
    >
      <Link
        href={productHref}
        className={`group/card relative w-full rounded-[4px] bg-black/6 overflow-hidden block ${!imageH ? (compactImage ? "aspect-3/4 sm:aspect-auto sm:h-[280px] md:h-[305px]" : "aspect-3/4 sm:aspect-auto sm:h-[280px] md:h-[340px]") : ""}`}
        style={imageH ? { height: imageH } : undefined}
        onMouseMove={(e) => {
          if (!product?.images || product.images.length <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const width = rect.width;
          const imageCount = Math.min(product.images.length, 3);
          const sectionWidth = width / imageCount;
          const newIndex = Math.min(
            Math.floor(x / sectionWidth),
            imageCount - 1,
          );
          if (newIndex !== hoveredImageIndex) {
            setHoveredImageIndex(newIndex);
          }
        }}
        onMouseLeave={() => setHoveredImageIndex(0)}
      >
        {product?.images?.slice(0, 3).map((img, idx) => (
          <Image
            key={idx}
            src={img}
            alt={`${product.name} ${idx + 1}`}
            fill
            sizes="(max-width: 640px) 176px, 254px"
            quality={75}
            className={`object-cover object-center bg-[#F8FAFC] transition-opacity duration-300 ${
              idx === hoveredImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {"rank" in props && props.rank != null && (
          <span className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 bg-[#020617] text-white text-xs sm:text-sm font-bold font-manrope rounded-[4px] min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1 py-0.5 flex items-center justify-center">
            {String(props.rank).padStart(2, "0")}
          </span>
        )}
        {product?.images && product.images.length >= 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
            {product.images.length === 1 ? (
              <span className="h-0.5 flex-1 rounded-full bg-white" />
            ) : (
              product.images.slice(0, 3).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    idx === hoveredImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))
            )}
          </div>
        )}
        {wishlistButton}
      </Link>
      <div className="flex flex-col gap-2 sm:gap-3">
        {cartButton}
        {cartModal}

        <Link href={productHref} className="flex flex-col gap-1.5 sm:gap-2">
          <p className="text-text-primary font-medium text-base font-manrope line-clamp-2 leading-6">
            {product?.name ?? "Product"}
          </p>
          <div className="flex flex-col">
            {product && discount ? (
              <p className="text-text-secondary font-normal text-xs font-manrope tracking-[-0.48px] line-through">
                {formatPrice(product.price)}
              </p>
            ) : !product ? (
              <p className="text-text-secondary font-normal text-xs font-manrope tracking-[-0.48px] line-through">
                000₮
              </p>
            ) : null}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {product && discount ? (
                <p className="text-accent-rose font-semibold text-base font-manrope tracking-[-0.64px]">
                  {discount}%
                </p>
              ) : !product ? (
                <p className="text-accent-rose font-semibold text-base font-manrope tracking-[-0.64px]">
                  0%
                </p>
              ) : null}
              <p className="text-text-primary font-semibold text-base font-manrope tracking-[-0.64px]">
                {product
                  ? formatPrice(
                      getDisplayPrice(product.price, product.discount_price),
                    )
                  : "000₮"}
              </p>
            </div>
          </div>
          {ratingBlock("sm")}
        </Link>
      </div>
    </div>
  );
};
