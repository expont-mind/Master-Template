"use client";

import { useMemo } from "react";

import type { CartItem } from "@/components/checkout/constants";
import type { OrderItemPayload } from "@/components/checkout/PaymentModal";
import type { CartItem as StoreCartItem } from "@/types/product";

interface ResolvedPricing {
  sellingPrice: number;
  originalPrice: number;
  displayName: string;
}

/**
 * Resolve display name + selling/original price for a single cart item.
 * Variant data wins over product data; discount_price only applies when it
 * actually reduces the price.
 */
function resolveCartItemPricing(ci: StoreCartItem): ResolvedPricing {
  const price = ci.variant ? ci.variant.price : ci.product.price;
  const discountPrice = ci.variant ? ci.variant.discount_price : ci.product.discount_price;
  const hasDiscount = discountPrice != null && discountPrice < price;
  const sellingPrice = hasDiscount ? discountPrice : price;
  const displayName = ci.variant?.name
    ? `${ci.product.name} - ${ci.variant.name}`
    : ci.product.name;
  return { sellingPrice, originalPrice: price, displayName };
}

interface UseCartItemViewsReturn {
  items: CartItem[];
  orderItemsPayload: OrderItemPayload[];
}

/**
 * Build two complementary views of the cart for the checkout page:
 *   - items: display-shape used by PaymentSummary
 *   - orderItemsPayload: server-action-shape used by payment invoice calls
 *
 * Both derive from the same cartItems source via a shared pricing resolver,
 * eliminating the prior two near-identical useMemo blocks on the page.
 */
export function useCartItemViews(cartItems: StoreCartItem[]): UseCartItemViewsReturn {
  const items: CartItem[] = useMemo(
    () =>
      cartItems.map((ci) => {
        const { sellingPrice, originalPrice, displayName } = resolveCartItemPricing(ci);
        return {
          id: ci.id,
          name: displayName,
          originalPrice,
          salePrice: sellingPrice,
          quantity: ci.quantity,
          image: ci.variant?.images?.[0] ?? ci.product.images?.[0],
          variantName: ci.variant?.name ?? null,
          sku: ci.variant?.sku ?? ci.product.sku ?? null,
        };
      }),
    [cartItems],
  );

  const orderItemsPayload: OrderItemPayload[] = useMemo(
    () =>
      cartItems.map((ci) => {
        const { sellingPrice, displayName } = resolveCartItemPricing(ci);
        return {
          productId: ci.product.id,
          name: displayName,
          price: sellingPrice,
          quantity: ci.quantity,
          variantId: ci.variant?.id ?? null,
          variantName: ci.variant?.name ?? null,
        };
      }),
    [cartItems],
  );

  return { items, orderItemsPayload };
}
