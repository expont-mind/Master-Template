"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AddToCartModal } from "@/components/product/AddToCartModal";
import { ShoppingCartSmall } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";

import { getDisplayPrice, isProductOutOfStock, RatingBlock, WishlistButton } from "./_shared";
import { useProductCard } from "./_useProductCard";

import type { Product } from "@/types/database";

interface ProductCardDefaultProps {
  product?: Product;
  rank?: number;
  imageHeight?: number;
  fillParent?: boolean;
  compactImage?: boolean;
}

interface ImageHoverProps {
  product: Product | undefined;
  hoveredImageIndex: number;
  onHoverIndex: (idx: number) => void;
}

function HoverableImages({ product, hoveredImageIndex, onHoverIndex }: ImageHoverProps) {
  return (
    <>
      {product?.images?.slice(0, 3).map((img, idx) => (
        <Image
          key={img}
          src={img}
          alt={`${product.name} ${idx + 1}`}
          fill
          sizes="(max-width: 640px) 176px, 254px"
          quality={90}
          className={`object-cover object-center bg-surface transition-opacity duration-300 ${
            idx === hoveredImageIndex ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => onHoverIndex(idx)}
        />
      ))}
    </>
  );
}

function ImageStripIndicator({
  count,
  hoveredImageIndex,
}: {
  count: number;
  hoveredImageIndex: number;
}) {
  if (count < 1) return null;
  return (
    <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
      {count === 1 ? (
        <span className="h-0.5 flex-1 rounded-full bg-white" />
      ) : (
        Array.from({ length: Math.min(count, 3) }, (_, idx) => (
          <span
            key={idx}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              idx === hoveredImageIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))
      )}
    </div>
  );
}

function PriceArea({ product, discount }: { product?: Product; discount: number | null }) {
  if (!product) {
    return (
      <div className="flex flex-col">
        <p className="text-text-secondary font-normal text-xs font-manrope tracking-[-0.48px] line-through">
          000₮
        </p>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <p className="text-brand-primary font-semibold text-base font-manrope tracking-[-0.64px]">
            0%
          </p>
          <p className="text-text-primary font-semibold text-base font-manrope tracking-[-0.64px]">
            000₮
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {discount && (
        <p className="text-text-secondary font-normal text-xs font-manrope tracking-[-0.48px] line-through">
          {formatPrice(product.price)}
        </p>
      )}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {discount && (
          <p className="text-brand-primary font-semibold text-base font-manrope tracking-[-0.64px]">
            {discount}%
          </p>
        )}
        <p className="text-text-primary font-semibold text-base font-manrope tracking-[-0.64px]">
          {formatPrice(getDisplayPrice(product.price, product.discount_price))}
        </p>
      </div>
    </div>
  );
}

function imageBlockClass(imageHeight: number | undefined, compactImage?: boolean): string {
  if (imageHeight) {
    return "group/card relative w-full rounded-[4px] bg-black/6 overflow-hidden block";
  }
  const sizeClass = compactImage
    ? "aspect-3/4 sm:aspect-auto sm:h-[280px] md:h-[305px]"
    : "aspect-3/4 sm:aspect-auto sm:h-[280px] md:h-[340px]";
  return `group/card relative w-full rounded-[4px] bg-black/6 overflow-hidden block ${sizeClass}`;
}

function useHoveredImage(product: Product | undefined) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const images = product?.images;
    if (!images || images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const count = Math.min(images.length, 3);
    const x = e.clientX - rect.left;
    const newIndex = Math.min(Math.floor(x / (rect.width / count)), count - 1);
    if (newIndex !== hoveredImageIndex) setHoveredImageIndex(newIndex);
  };

  const handleMouseLeave = () => setHoveredImageIndex(0);

  return { hoveredImageIndex, setHoveredImageIndex, handleMouseMove, handleMouseLeave };
}

function CardImageBlock({
  product,
  productHref,
  rank,
  imageHeight,
  compactImage,
  wishlisted,
  onToggleWishlist,
}: {
  product: Product | undefined;
  productHref: string;
  rank: number | undefined;
  imageHeight: number | undefined;
  compactImage: boolean | undefined;
  wishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const { hoveredImageIndex, setHoveredImageIndex, handleMouseMove, handleMouseLeave } =
    useHoveredImage(product);
  const imageCount = product?.images?.length ?? 0;
  return (
    <Link
      href={productHref}
      className={imageBlockClass(imageHeight, compactImage)}
      style={imageHeight ? { height: imageHeight } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <HoverableImages
        product={product}
        hoveredImageIndex={hoveredImageIndex}
        onHoverIndex={setHoveredImageIndex}
      />
      {rank != null && (
        <span className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 bg-text-primary text-white text-xs sm:text-sm font-bold font-manrope rounded-[4px] min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1 py-0.5 flex items-center justify-center">
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <ImageStripIndicator count={imageCount} hoveredImageIndex={hoveredImageIndex} />
      <WishlistButton wishlisted={wishlisted} onToggle={onToggleWishlist} />
    </Link>
  );
}

export function ProductCardDefault({
  product,
  rank,
  imageHeight,
  fillParent,
  compactImage,
}: ProductCardDefaultProps) {
  const { isModalOpen, setIsModalOpen, wishlisted, reviewSummary, handleToggleWishlist } =
    useProductCard(product);
  const outOfStock = isProductOutOfStock(product);
  const discount = product ? getDiscountPercentage(product.price, product.discount_price) : null;
  const productHref = product ? ROUTES.PRODUCT(product.slug) : "#";
  const widthClass = fillParent ? "w-full" : "w-[176px] sm:w-[254px] shrink-0";

  return (
    <div className={`flex flex-col gap-2 sm:gap-2.5 ${widthClass}`}>
      <CardImageBlock
        product={product}
        productHref={productHref}
        rank={rank}
        imageHeight={imageHeight}
        compactImage={compactImage}
        wishlisted={wishlisted}
        onToggleWishlist={handleToggleWishlist}
      />
      <div className="flex flex-col gap-2 sm:gap-3">
        <button
          type="button"
          className={`h-8 sm:h-9 px-2 sm:px-3 border border-border rounded-sm flex items-center justify-center gap-0.5 transition-colors min-h-[36px] sm:min-h-0 ${
            outOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-surface"
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={outOfStock}
        >
          <ShoppingCartSmall />
          <span className="text-primary font-normal text-xs sm:text-sm font-manrope">
            {outOfStock ? "Дууссан" : "Сагслах"}
          </span>
        </button>
        {product && (
          <AddToCartModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
          />
        )}
        <Link href={productHref} className="flex flex-col gap-1.5 sm:gap-2">
          <p className="text-text-primary font-medium text-base font-manrope line-clamp-2 leading-6">
            {product?.name ?? "Product"}
          </p>
          <PriceArea product={product} discount={discount} />
          <RatingBlock
            averageRating={reviewSummary?.averageRating}
            totalCount={reviewSummary?.totalCount}
            size="sm"
          />
        </Link>
      </div>
    </div>
  );
}
