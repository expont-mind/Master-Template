// Cart pricing helpers — pure functions, no React, safe to import
// anywhere. Centralises the pricing hierarchy (Hard Invariant #4):
//   variant.discount_price > variant.price > product.discount_price > product.price
//
// Coupon scope calculation (Invariant #5) deliberately STAYS in
// app/checkout/page.tsx as the single source of truth; cart/page.tsx
// duplicates the preview because moving it requires byte-identical
// behavior verification we can't yet do without tests.

import type { CartItem } from "@/types/product";

/**
 * Resolve the effective sell price for a cart item, honoring the
 * pricing hierarchy: variant.discount_price (if discounted) wins,
 * then variant.price, then product.discount_price, then product.price.
 */
export function getEffectiveSellPrice(item: CartItem): number {
  if (item.variant) {
    if (item.variant.discount_price != null && item.variant.discount_price < item.variant.price) {
      return item.variant.discount_price;
    }
    return item.variant.price;
  }
  if (item.product.discount_price != null && item.product.discount_price < item.product.price) {
    return item.product.discount_price;
  }
  return item.product.price;
}

/**
 * The non-discounted "list" price for a cart item — variant.price if
 * a variant is selected, else product.price. Used as the baseline
 * against which `getEffectiveSellPrice` shows savings.
 */
export function getListPrice(item: CartItem): number {
  return item.variant ? item.variant.price : item.product.price;
}
