// Pure helpers for AddToCart state. No React, no Supabase — testable.
//
// These were inlined inside the AddToCartModal arrow function before refactor.

import { getDiscountPercentage } from "@/lib/utils/formatters";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

// Compute initial selected options for a product. Mirrors the prior
// inline logic inside the mount effect of AddToCartModal:
//   - If variant has option_values: map required groups positionally
//   - Otherwise: pre-select the first value of each required group only
export function computeInitialSelectedOptions(
  variant: ProductVariant | undefined,
  optionGroups: OptionGroup[],
  requiredGroups: OptionGroup[],
): Record<string, string> {
  const options: Record<string, string> = {};
  if (variant?.option_values && variant.option_values.length > 0) {
    requiredGroups.forEach((group, idx) => {
      if (variant.option_values && variant.option_values[idx]) {
        options[group.type] = variant.option_values[idx];
      }
    });
    return options;
  }
  optionGroups.forEach((group) => {
    if (group.values.length > 0 && group.is_required !== false) {
      options[group.type] = group.values[0];
    }
  });
  return options;
}

// Pick the initial variant for option-group products. Prefers the
// "base" required-only variant; falls back to initialVariant or first.
export function pickInitialVariant(
  variants: ProductVariant[],
  requiredGroups: OptionGroup[],
  initialVariant: ProductVariant | null,
): ProductVariant | undefined {
  const baseVariant =
    requiredGroups.length > 0
      ? variants.find((v) => v.option_values && v.option_values.length === requiredGroups.length)
      : undefined;
  return initialVariant || baseVariant || variants[0];
}

// Build a variant name from selected options: required values + selected
// optional values, in the canonical order. Returns null when any required
// value is missing.
export function buildVariantName(
  options: Record<string, string>,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): string | null {
  const parts = requiredGroups.map((g) => options[g.type]);
  if (parts.some((v) => !v)) return null;
  for (const og of optionalGroups) {
    if (options[og.type]) parts.push(options[og.type]);
  }
  return parts.join(" / ");
}

// Position of a group in the variant's option_values array.
// option_values is ordered: required groups first, then optional groups.
export function getOptionValuesIndex(
  groupType: string,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): number {
  const reqIdx = requiredGroups.findIndex((g) => g.type === groupType);
  if (reqIdx !== -1) return reqIdx;
  const optIdx = optionalGroups.findIndex((g) => g.type === groupType);
  if (optIdx !== -1) return requiredGroups.length + optIdx;
  return -1;
}

// Whether every variant matching (groupType=value) is out of stock.
export function isOptionOutOfStock(
  groupType: string,
  value: string,
  variants: ProductVariant[] | null | undefined,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): boolean {
  if (!variants) return false;
  const posIndex = getOptionValuesIndex(groupType, requiredGroups, optionalGroups);
  if (posIndex === -1) return false;
  const matching = variants.filter((v) => {
    if (!v.option_values || v.option_values.length <= posIndex) return false;
    return v.option_values[posIndex] === value;
  });
  return matching.length > 0 && matching.every((v) => v.stock_quantity <= 0);
}

// First variant image matching a given option value, if any.
export function getOptionImage(
  groupType: string,
  value: string,
  variants: ProductVariant[] | null | undefined,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): string | null {
  if (!variants) return null;
  const posIndex = getOptionValuesIndex(groupType, requiredGroups, optionalGroups);
  if (posIndex === -1) return null;
  const match = variants.find((v) => {
    if (!v.option_values || v.option_values.length <= posIndex) return false;
    return v.option_values[posIndex] === value && (v.images?.length ?? 0) > 0;
  });
  return match?.images?.[0] ?? null;
}

// Sum staged cart items at their selling price; falls back to
// `sellingPrice * quantity` when the list is empty.
export function computeTotalPrice(
  cartItems: StagedCartItem[],
  variants: ProductVariant[] | null | undefined,
  resolvedProduct: ProductWithDetails,
  sellingPrice: number,
  quantity: number,
): number {
  if (cartItems.length === 0) return sellingPrice * quantity;
  return cartItems.reduce((sum, item) => {
    const variant = variants?.find((v) => v.id === item.variantId);
    const price = variant?.price ?? resolvedProduct.price;
    const discountPrice = variant ? variant.discount_price : resolvedProduct.discount_price;
    const selling = discountPrice != null && discountPrice < price ? discountPrice : price;
    return sum + selling * item.quantity;
  }, 0);
}

// Derived pricing/display data for the currently-selected variant.
export function computeDisplayPricing(
  selectedVariant: ProductVariant | null,
  resolvedProduct: ProductWithDetails,
) {
  const currentPrice = selectedVariant ? selectedVariant.price : resolvedProduct.price;
  const currentDiscountPrice = selectedVariant
    ? selectedVariant.discount_price
    : resolvedProduct.discount_price;
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : resolvedProduct.stock_quantity;
  const discount = getDiscountPercentage(currentPrice, currentDiscountPrice);
  const displayImage = selectedVariant?.images?.[0] ?? resolvedProduct.images?.[0];
  const displayName = selectedVariant?.name || resolvedProduct.name;
  const sellingPrice =
    currentDiscountPrice != null && currentDiscountPrice < currentPrice
      ? currentDiscountPrice
      : currentPrice;
  return {
    currentPrice,
    currentDiscountPrice,
    currentStock,
    discount,
    displayImage,
    displayName,
    sellingPrice,
  };
}

// Merge a new staged item: increments quantity when the variant already
// exists, otherwise appends.
export function mergeStagedItem(
  prev: StagedCartItem[],
  variantId: string,
  options: Record<string, string>,
  addQuantity: number,
): StagedCartItem[] {
  const existing = prev.find((item) => item.variantId === variantId);
  if (existing) {
    return prev.map((item) =>
      item.variantId === variantId ? { ...item, quantity: item.quantity + addQuantity } : item,
    );
  }
  return [
    ...prev,
    {
      variantId,
      options: { ...options },
      quantity: addQuantity,
    },
  ];
}

// Replace an editing entry with a new variant id, preserving quantity.
export function replaceEditingItem(
  prev: StagedCartItem[],
  editingCartItemId: string,
  newVariantId: string,
  newOptions: Record<string, string>,
): StagedCartItem[] {
  const oldItem = prev.find((item) => item.variantId === editingCartItemId);
  const oldQty = oldItem?.quantity ?? 1;
  const withoutOld = prev.filter((item) => item.variantId !== editingCartItemId);
  return mergeStagedItem(withoutOld, newVariantId, newOptions, oldQty);
}
