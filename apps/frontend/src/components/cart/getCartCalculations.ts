// Pricing & discount calculator for the cart page.
//
// All the math for subtotal, delivery, coupon, point discount, and final
// payable amount lives here so the page component stays presentational.
//
// Coupon discount logic mirrors the rules in CLAUDE.md (Pricing & Discount):
//   - "all" scope → applies to entire cartSubtotal
//   - "product"/"category"/"brand" scope → applies to matching units only
//   - "percentage" → discount = subtotal × value/100, capped at max_discount
//   - "fixed" → per-unit discount, applied to up to max_applicable_qty units
//   - "free_shipping" → up to deliveryFee

import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";
import { getEffectiveSellPrice, getListPrice } from "@/lib/utils/cart-pricing";

import type { SelectedCoupon } from "@/stores/cart-store";
import type { DeliveryZone } from "@/types/database";
import type { CartItem } from "@/types/product";

interface UseCartCalculationsArgs {
  items: CartItem[];
  deliveryZones: DeliveryZone[];
  selectedCoupon: SelectedCoupon | null;
  selectedPoints: number | null;
  productCategoryMap: Record<string, string[]>;
}

export interface CartCalculations {
  totalCount: number;
  subtotal: number;
  totalDiscount: number;
  cartSubtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  pointDiscount: number;
  totalPayable: number;
  ubZone: DeliveryZone | null;
}

export function getCartCalculations({
  items,
  deliveryZones,
  selectedCoupon,
  selectedPoints,
  productCategoryMap,
}: UseCartCalculationsArgs): CartCalculations {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + getListPrice(item) * item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => {
    const list = getListPrice(item);
    const sell = getEffectiveSellPrice(item);
    return sum + (list - sell) * item.quantity;
  }, 0);
  const ubZone = deliveryZones.find((z) => z.name === DELIVERY_ZONES_CONFIG.capital) ?? null;
  const cartSubtotal = subtotal - totalDiscount;
  const deliveryFee =
    ubZone &&
    ubZone.is_free_delivery_enabled &&
    ubZone.free_delivery_threshold != null &&
    cartSubtotal >= ubZone.free_delivery_threshold
      ? 0
      : (ubZone?.delivery_fee ?? 0);

  const couponDiscount = computeCouponDiscount({
    items,
    selectedCoupon,
    cartSubtotal,
    deliveryFee,
    productCategoryMap,
  });

  const totalAfterCoupon = cartSubtotal + deliveryFee - couponDiscount;
  const pointDiscount = selectedPoints ? Math.min(selectedPoints, totalAfterCoupon) : 0;
  const totalPayable = totalAfterCoupon - pointDiscount;

  return {
    totalCount,
    subtotal,
    totalDiscount,
    cartSubtotal,
    deliveryFee,
    couponDiscount,
    pointDiscount,
    totalPayable,
    ubZone,
  };
}

interface ComputeCouponArgs {
  items: CartItem[];
  selectedCoupon: SelectedCoupon | null;
  cartSubtotal: number;
  deliveryFee: number;
  productCategoryMap: Record<string, string[]>;
}

interface ApplicableSubset {
  applicableSubtotal: number;
  applicableUnits: number[];
}

function resolveApplicableSubset(
  selectedCoupon: NonNullable<SelectedCoupon>,
  items: CartItem[],
  cartSubtotal: number,
  productCategoryMap: Record<string, string[]>,
): ApplicableSubset {
  if (!selectedCoupon.scope || selectedCoupon.scope === "all") {
    return { applicableSubtotal: cartSubtotal, applicableUnits: [] };
  }
  const scopeIds = new Set(selectedCoupon.scope_item_ids ?? []);
  const matchingUnits: number[] = [];
  for (const ci of items) {
    if (!matchesScope(ci, selectedCoupon.scope, scopeIds, productCategoryMap)) {
      continue;
    }
    const unitPrice = priceForCartItem(ci);
    for (let i = 0; i < ci.quantity; i++) matchingUnits.push(unitPrice);
  }
  matchingUnits.sort((a, b) => b - a);
  const limit = selectedCoupon.max_applicable_qty ?? matchingUnits.length;
  const limited = matchingUnits.slice(0, limit);
  const applicableSubtotal = limited.reduce((sum, p) => sum + p, 0);
  return { applicableSubtotal, applicableUnits: limited };
}

function computePercentageDiscount(
  coupon: NonNullable<SelectedCoupon>,
  applicableSubtotal: number,
): number {
  let discount = Math.round(applicableSubtotal * (coupon.discount_value / 100));
  if (coupon.max_discount_amount) {
    discount = Math.min(discount, coupon.max_discount_amount);
  }
  return Math.min(discount, applicableSubtotal);
}

function computeFixedDiscount(
  coupon: NonNullable<SelectedCoupon>,
  applicableUnits: number[],
  applicableSubtotal: number,
): number {
  if (applicableUnits.length > 0) {
    return applicableUnits.reduce(
      (sum, unitPrice) => sum + Math.min(coupon.discount_value, unitPrice),
      0,
    );
  }
  return Math.min(coupon.discount_value, applicableSubtotal);
}

function computeCouponDiscount({
  items,
  selectedCoupon,
  cartSubtotal,
  deliveryFee,
  productCategoryMap,
}: ComputeCouponArgs): number {
  if (!selectedCoupon) return 0;

  const { applicableSubtotal, applicableUnits } = resolveApplicableSubset(
    selectedCoupon,
    items,
    cartSubtotal,
    productCategoryMap,
  );

  switch (selectedCoupon.type) {
    case "percentage":
      return computePercentageDiscount(selectedCoupon, applicableSubtotal);
    case "fixed":
      return computeFixedDiscount(selectedCoupon, applicableUnits, applicableSubtotal);
    case "free_shipping":
      return Math.min(selectedCoupon.discount_value, deliveryFee);
    default:
      return 0;
  }
}

function priceForCartItem(ci: CartItem): number {
  if (ci.variant) {
    return ci.variant.discount_price != null && ci.variant.discount_price < ci.variant.price
      ? ci.variant.discount_price
      : ci.variant.price;
  }
  return ci.product.discount_price != null && ci.product.discount_price < ci.product.price
    ? ci.product.discount_price
    : ci.product.price;
}

function matchesScope(
  ci: CartItem,
  scope: SelectedCoupon["scope"],
  scopeIds: Set<string>,
  productCategoryMap: Record<string, string[]>,
): boolean {
  if (scope === "product") return scopeIds.has(ci.product.id);
  if (scope === "category") {
    const cats = productCategoryMap[ci.product.id] ?? [];
    return cats.some((catId) => scopeIds.has(catId));
  }
  if (scope === "brand") {
    return ci.product.brand_id ? scopeIds.has(ci.product.brand_id) : false;
  }
  return false;
}
