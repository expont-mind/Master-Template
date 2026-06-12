"use client";

import { useMemo } from "react";

import type { ProductWithDetails, ProductVariant } from "@/lib/queries/products";

export interface ProductPricing {
  selectedVariant: ProductVariant | undefined;
  hasVariants: boolean;
  currentPrice: number;
  currentDiscountPrice: number | null;
  currentStock: number;
  hasDiscount: boolean;
  discount: number | null;
  sellingPrice: number;
}

const EMPTY_PRICING: ProductPricing = {
  selectedVariant: undefined,
  hasVariants: false,
  currentPrice: 0,
  currentDiscountPrice: null,
  currentStock: 0,
  hasDiscount: false,
  discount: null,
  sellingPrice: 0,
};

function pickActiveVariant(
  product: ProductWithDetails,
  selectedVariantId: string | undefined,
): ProductVariant | undefined {
  const selected = product.variants?.find((v) => v.id === selectedVariantId);
  return selected ?? product.variants?.[0];
}

function resolveCurrentNumbers(
  product: ProductWithDetails,
  hasVariants: boolean,
  activeVariant: ProductVariant | undefined,
) {
  const currentPrice = hasVariants ? (activeVariant?.price ?? product.price) : product.price;
  const currentDiscountPrice = hasVariants
    ? (activeVariant?.discount_price ?? null)
    : product.discount_price;
  const currentStock = hasVariants ? (activeVariant?.stock_quantity ?? 0) : product.stock_quantity;
  return { currentPrice, currentDiscountPrice, currentStock };
}

function computeDiscountFields(currentPrice: number, currentDiscountPrice: number | null) {
  const hasDiscount = currentDiscountPrice != null && currentDiscountPrice < currentPrice;
  const discount = hasDiscount
    ? Math.round(((currentPrice - (currentDiscountPrice as number)) / currentPrice) * 100)
    : null;
  const sellingPrice = hasDiscount ? (currentDiscountPrice as number) : currentPrice;
  return { hasDiscount, discount, sellingPrice };
}

/**
 * Derive the prices, stock, and discount % shown on the product detail
 * page. If the product has variants we use the selected variant's
 * fields exclusively (no fallback to other variants); otherwise we use
 * the product-level fields.
 *
 * Accepts `undefined` to keep the hook callable before the data lands.
 */
export function useProductPricing(
  product: ProductWithDetails | null | undefined,
  selectedVariantId: string | undefined,
): ProductPricing {
  return useMemo(() => {
    if (!product) return EMPTY_PRICING;

    const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
    const hasVariants = !!(product.variants && product.variants.length > 0);
    const activeVariant = pickActiveVariant(product, selectedVariantId);
    const { currentPrice, currentDiscountPrice, currentStock } = resolveCurrentNumbers(
      product,
      hasVariants,
      activeVariant,
    );
    const { hasDiscount, discount, sellingPrice } = computeDiscountFields(
      currentPrice,
      currentDiscountPrice,
    );

    return {
      selectedVariant,
      hasVariants,
      currentPrice,
      currentDiscountPrice,
      currentStock,
      hasDiscount,
      discount,
      sellingPrice,
    };
  }, [product, selectedVariantId]);
}
