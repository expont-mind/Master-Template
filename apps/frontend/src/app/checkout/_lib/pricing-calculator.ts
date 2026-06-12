// Pure pricing calculator for checkout.
//
// Extracted from app/checkout/page.tsx to enable:
//   - Unit testing without React/Supabase setup
//   - Reuse from cart page (currently duplicates this logic)
//   - Reducing CheckoutPage cyclomatic complexity from 51 to ~10
//
// All functions are pure: no I/O, no side effects, no React.

import type { SelectedCoupon } from "@/stores/cart-store";
import type { DeliveryZone } from "@/types/database";
import type { CartItem as StoreCartItem } from "@/types/product";

export interface PricedLineItem {
  originalPrice: number;
  salePrice: number;
  quantity: number;
}

export interface ProductDiscountBreakdown {
  subtotal: number;
  totalDiscount: number;
  afterProductDiscount: number;
}

/**
 * Sum line items: subtotal (original × qty), totalDiscount, afterProductDiscount.
 */
export function calculateProductDiscount(items: PricedLineItem[]): ProductDiscountBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.salePrice) * item.quantity,
    0,
  );
  return {
    subtotal,
    totalDiscount,
    afterProductDiscount: subtotal - totalDiscount,
  };
}

/**
 * Resolve the active delivery zone based on customer city.
 *
 * Returns null when city is empty (customer hasn't picked address yet) or
 * when no zone configuration matches (treat as no delivery available).
 */
export function resolveActiveZone(
  city: string,
  zones: DeliveryZone[],
  config: { capital: string; rural: string },
): DeliveryZone | null {
  if (!city) return null;
  if (city === config.capital) {
    return zones.find((z) => z.name === config.capital) ?? null;
  }
  return zones.find((z) => z.name === config.rural) ?? null;
}

/**
 * Calculate delivery fee. Applies free-shipping threshold when configured.
 *
 * The threshold check uses afterProductDiscount (post product-level discount,
 * pre coupon) — matching the current checkout behavior.
 */
export function calculateDeliveryFee(
  zone: DeliveryZone | null,
  afterProductDiscount: number,
): number {
  if (!zone) return 0;
  if (
    zone.is_free_delivery_enabled &&
    zone.free_delivery_threshold != null &&
    afterProductDiscount >= zone.free_delivery_threshold
  ) {
    return 0;
  }
  return zone.delivery_fee ?? 0;
}

/**
 * Resolve the effective per-unit price for a cart item.
 * Variant prices win over product prices; discount_price wins when valid.
 */
export function resolveUnitPrice(item: StoreCartItem): number {
  if (item.variant) {
    const { price, discount_price } = item.variant;
    return discount_price != null && discount_price < price ? discount_price : price;
  }
  const { price, discount_price } = item.product;
  return discount_price != null && discount_price < price ? discount_price : price;
}

/**
 * Check whether a cart item matches the coupon's scope filter.
 * - `all` / null → always matches (caller skips this fn for that case)
 * - `product` → cart item product id is in scope_item_ids
 * - `category` → any of the product's categories is in scope_item_ids
 * - `brand` → product's brand_id is in scope_item_ids
 */
function itemMatchesCouponScope(
  item: StoreCartItem,
  coupon: SelectedCoupon,
  productCategoryMap: Record<string, string[]>,
): boolean {
  const scopeIds = new Set(coupon.scope_item_ids ?? []);
  if (coupon.scope === "product") {
    return scopeIds.has(item.product.id);
  }
  if (coupon.scope === "category") {
    const cats = productCategoryMap[item.product.id] ?? [];
    return cats.some((catId) => scopeIds.has(catId));
  }
  if (coupon.scope === "brand") {
    return item.product.brand_id ? scopeIds.has(item.product.brand_id) : false;
  }
  return false;
}

interface ScopeResult {
  applicableSubtotal: number;
  applicableUnits: number[];
}

/**
 * Resolve the subset of cart spend that a coupon applies to.
 *
 * For scoped coupons (product/category/brand), expands each matching item
 * into per-unit prices, sorts descending, then takes up to max_applicable_qty
 * units. This matches the existing "highest-priced units win" rule used by
 * the checkout page's fixed-discount calculation.
 */
function resolveCouponScope(
  coupon: SelectedCoupon,
  cartItems: StoreCartItem[],
  productCategoryMap: Record<string, string[]>,
  afterProductDiscount: number,
): ScopeResult {
  if (!coupon.scope || coupon.scope === "all") {
    return { applicableSubtotal: afterProductDiscount, applicableUnits: [] };
  }

  const matchingUnits: number[] = [];
  for (const item of cartItems) {
    if (!itemMatchesCouponScope(item, coupon, productCategoryMap)) continue;
    const unitPrice = resolveUnitPrice(item);
    for (let i = 0; i < item.quantity; i++) {
      matchingUnits.push(unitPrice);
    }
  }

  matchingUnits.sort((a, b) => b - a);
  const limit = coupon.max_applicable_qty ?? matchingUnits.length;
  const limited = matchingUnits.slice(0, limit);
  const applicableSubtotal = limited.reduce((sum, p) => sum + p, 0);
  return { applicableSubtotal, applicableUnits: limited };
}

/**
 * Calculate the coupon discount amount.
 *
 * Returns 0 when:
 *   - No coupon selected
 *   - Coupon type is unknown
 *   - Applicable subtotal is 0 (no matching items for scoped coupon)
 *
 * Capped at applicableSubtotal so a coupon can never exceed the items it
 * applies to. For free_shipping, capped at deliveryFee.
 */
export function calculateCouponDiscount(input: {
  coupon: SelectedCoupon | null;
  cartItems: StoreCartItem[];
  productCategoryMap: Record<string, string[]>;
  afterProductDiscount: number;
  deliveryFee: number;
}): number {
  const { coupon, cartItems, productCategoryMap, afterProductDiscount, deliveryFee } = input;
  if (!coupon) return 0;

  const { applicableSubtotal, applicableUnits } = resolveCouponScope(
    coupon,
    cartItems,
    productCategoryMap,
    afterProductDiscount,
  );

  if (coupon.type === "percentage") {
    let discount = Math.round(applicableSubtotal * (coupon.discount_value / 100));
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
    return Math.min(discount, applicableSubtotal);
  }

  if (coupon.type === "fixed") {
    if (applicableUnits.length > 0) {
      return applicableUnits.reduce(
        (sum, unitPrice) => sum + Math.min(coupon.discount_value, unitPrice),
        0,
      );
    }
    return Math.min(coupon.discount_value, applicableSubtotal);
  }

  if (coupon.type === "free_shipping") {
    return Math.min(coupon.discount_value, deliveryFee);
  }

  return 0;
}

export interface CheckoutTotals {
  subtotal: number;
  totalDiscount: number;
  afterProductDiscount: number;
  deliveryFee: number;
  couponDiscount: number;
  pointDiscount: number;
  totalPayable: number;
}

/**
 * Top-level orchestrator: produce the full totals breakdown used by the UI.
 *
 * Order of operations (matches existing checkout):
 *   afterProductDiscount = subtotal - productDiscount
 *   totalAfterCoupon     = afterProductDiscount + deliveryFee - couponDiscount
 *   pointDiscount        = min(selectedPoints, totalAfterCoupon)
 *   totalPayable         = totalAfterCoupon - pointDiscount
 *
 * Points apply AFTER coupon so a customer can never go negative.
 */
export function calculateCheckoutTotals(input: {
  lineItems: PricedLineItem[];
  cartItems: StoreCartItem[];
  productCategoryMap: Record<string, string[]>;
  coupon: SelectedCoupon | null;
  selectedPoints: number | null;
  activeZone: DeliveryZone | null;
}): CheckoutTotals {
  const { subtotal, totalDiscount, afterProductDiscount } = calculateProductDiscount(
    input.lineItems,
  );

  const deliveryFee = calculateDeliveryFee(input.activeZone, afterProductDiscount);

  const couponDiscount = calculateCouponDiscount({
    coupon: input.coupon,
    cartItems: input.cartItems,
    productCategoryMap: input.productCategoryMap,
    afterProductDiscount,
    deliveryFee,
  });

  const totalAfterCoupon = afterProductDiscount + deliveryFee - couponDiscount;
  const pointDiscount = input.selectedPoints ? Math.min(input.selectedPoints, totalAfterCoupon) : 0;
  const totalPayable = totalAfterCoupon - pointDiscount;

  return {
    subtotal,
    totalDiscount,
    afterProductDiscount,
    deliveryFee,
    couponDiscount,
    pointDiscount,
    totalPayable,
  };
}
