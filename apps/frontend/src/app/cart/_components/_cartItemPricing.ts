import type { CartItem } from "@/types/product";

export interface CartItemPricing {
  price: number;
  discountPrice: number | null;
  hasDiscount: boolean;
  discount: number | null;
  sellingPrice: number;
  image: string | undefined;
  stockQuantity: number;
  variantLabel: string | null | undefined;
}

interface BasePricing {
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  image: string | undefined;
}

function pickBasePricing(item: CartItem): BasePricing {
  if (item.variant) {
    return {
      price: item.variant.price,
      discountPrice: item.variant.discount_price,
      stockQuantity: item.variant.stock_quantity,
      image: item.variant.images?.[0] ?? item.product.images?.[0],
    };
  }
  return {
    price: item.product.price,
    discountPrice: item.product.discount_price,
    stockQuantity: item.product.stock_quantity,
    image: item.product.images?.[0],
  };
}

function computeDiscount(
  price: number,
  discountPrice: number | null,
): { hasDiscount: boolean; discount: number | null; sellingPrice: number } {
  const hasDiscount = discountPrice != null && discountPrice < price;
  if (!hasDiscount) {
    return { hasDiscount: false, discount: null, sellingPrice: price };
  }
  return {
    hasDiscount: true,
    discount: Math.round(((price - discountPrice!) / price) * 100),
    sellingPrice: discountPrice!,
  };
}

/**
 * Resolves per-row display values for a cart item — variant takes precedence
 * over product. Pure function; no side effects.
 */
export function resolveCartItemPricing(item: CartItem): CartItemPricing {
  const base = pickBasePricing(item);
  const discount = computeDiscount(base.price, base.discountPrice);
  const variantLabel = item.variant?.option_values?.join(" / ") || item.variant?.name;

  return {
    price: base.price,
    discountPrice: base.discountPrice,
    image: base.image,
    stockQuantity: base.stockQuantity,
    variantLabel,
    ...discount,
  };
}
