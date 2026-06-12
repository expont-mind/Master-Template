"use client";

import Image from "next/image";

import { formatPrice } from "@/lib/utils/formatters";

import type { ProductVariant } from "@/lib/queries/products";

interface VariantFallbackListProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  productName?: string;
  productImage?: string;
  onVariantChange?: (variantId: string) => void;
}

/**
 * Fallback variant picker used when the product has no option_groups
 * metadata — renders one card per variant with image, name, and price.
 * The first variant displays the product-level name/image when provided.
 */
export function VariantFallbackList({
  variants,
  selectedVariantId,
  productName,
  productImage,
  onVariantChange,
}: VariantFallbackListProps) {
  return (
    <div className="flex flex-col">
      <p className="text-text-primary font-medium text-sm font-manrope px-0.5">Төрөл</p>
      <div className="grid grid-cols-2 gap-2 pt-3 px-0.5">
        {variants.map((variant, index) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            isSelected={selectedVariantId === variant.id}
            isFirst={index === 0}
            fallbackName={productName}
            fallbackImage={productImage}
            onSelect={() => onVariantChange?.(variant.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface VariantDisplay {
  isOutOfStock: boolean;
  discount: number | null;
  sellingPrice: number;
  displayName: string;
  displayImage: string | undefined;
}

function computeVariantDisplay(
  variant: ProductVariant,
  isFirst: boolean,
  fallbackName?: string,
  fallbackImage?: string,
): VariantDisplay {
  const isOutOfStock = variant.stock_quantity <= 0;
  const hasDiscount = variant.discount_price != null && variant.discount_price < variant.price;
  const discount = hasDiscount
    ? Math.round(((variant.price - variant.discount_price!) / variant.price) * 100)
    : null;
  const sellingPrice = hasDiscount ? variant.discount_price! : variant.price;
  const displayName =
    isFirst && fallbackName ? fallbackName : (variant.name ?? variant.sku ?? "Variant");
  const displayImage = isFirst && fallbackImage ? fallbackImage : variant.images?.[0];

  return { isOutOfStock, discount, sellingPrice, displayName, displayImage };
}

function buildVariantButtonClasses(isOutOfStock: boolean, isSelected: boolean): string {
  const base =
    "w-full p-0.5 border-[1.2px] rounded-lg flex items-center transition-all duration-300";
  if (isOutOfStock) return `${base} opacity-40 cursor-not-allowed`;
  if (isSelected) return `${base} border-text-primary bg-white shadow-sm cursor-pointer`;
  return `${base} border-transparent bg-white hover:border-border-strong cursor-pointer`;
}

function VariantPriceRow({
  discount,
  sellingPrice,
  listPrice,
}: {
  discount: number | null;
  sellingPrice: number;
  listPrice: number;
}) {
  return (
    <div className="flex gap-0.5">
      <div className="flex gap-0.5 min-w-[68px]">
        {discount && (
          <p className="text-brand-primary pt-px font-medium text-[10px] font-manrope">
            {discount}%
          </p>
        )}
        <p className="text-text-primary font-medium text-xs font-manrope tracking-tight">
          {formatPrice(sellingPrice)}
        </p>
      </div>
      {discount && (
        <span className="text-text-secondary pt-px text-[10px] font-manrope line-through tracking-[-0.4px]">
          {formatPrice(listPrice)}
        </span>
      )}
    </div>
  );
}

function VariantCard({
  variant,
  isSelected,
  isFirst,
  fallbackName,
  fallbackImage,
  onSelect,
}: {
  variant: ProductVariant;
  isSelected: boolean;
  isFirst: boolean;
  fallbackName?: string;
  fallbackImage?: string;
  onSelect: () => void;
}) {
  const { isOutOfStock, discount, sellingPrice, displayName, displayImage } = computeVariantDisplay(
    variant,
    isFirst,
    fallbackName,
    fallbackImage,
  );

  const handleClick = () => {
    if (!isOutOfStock) onSelect();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      className={buildVariantButtonClasses(isOutOfStock, isSelected)}
    >
      <div className="flex items-center border border-surface rounded-md w-full">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayName}
            width={44}
            height={44}
            quality={90}
            className="w-11 h-11 object-cover object-center rounded-l-md"
          />
        ) : (
          <div className="w-11 h-11 bg-surface rounded-l-md" />
        )}

        <div className="flex flex-col items-start px-2 py-0.5">
          <p className="text-text-primary font-normal text-xs font-manrope line-clamp-1">
            {displayName}
          </p>
          {isOutOfStock ? (
            <p className="text-brand-primary font-medium text-[10px] font-manrope">Дууссан</p>
          ) : (
            <VariantPriceRow
              discount={discount}
              sellingPrice={sellingPrice}
              listPrice={variant.price}
            />
          )}
        </div>
      </div>
    </button>
  );
}
