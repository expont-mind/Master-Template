"use client";

import { computeInitialSelectedOptions, pickInitialVariant } from "./_addToCartHelpers";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

// Reset state when the modal opens. Caller supplies the setters so we
// keep the body as a pure orchestrator.
export function applyOpenReset(input: {
  initialQuantity: number;
  initialVariant: ProductVariant | null;
  variants: ProductVariant[] | null | undefined;
  optionGroups: OptionGroup[] | undefined;
  requiredGroups: OptionGroup[];
  setQuantity: (n: number) => void;
  setHasAddedToCart: (b: boolean) => void;
  setCartItems: (items: StagedCartItem[]) => void;
  setEditingCartItemId: (id: string | null) => void;
  setMobilePhase: (p: "accordion" | "summary") => void;
  setExpandedGroupIndex: (i: number) => void;
  setSelectedVariantId: (id: string | undefined) => void;
  setSelectedOptions: (o: Record<string, string>) => void;
}) {
  const {
    initialQuantity,
    initialVariant,
    variants,
    optionGroups,
    requiredGroups,
    setQuantity,
    setHasAddedToCart,
    setCartItems,
    setEditingCartItemId,
    setMobilePhase,
    setExpandedGroupIndex,
    setSelectedVariantId,
    setSelectedOptions,
  } = input;

  setQuantity(initialQuantity);
  setHasAddedToCart(false);
  setCartItems([]);
  setEditingCartItemId(null);

  const hasVars = variants && variants.length > 0;
  setMobilePhase(hasVars ? "accordion" : "summary");
  if (hasVars) setExpandedGroupIndex(0);

  if (optionGroups && optionGroups.length > 0 && variants) {
    const variant = pickInitialVariant(variants, requiredGroups, initialVariant);
    setSelectedVariantId(variant?.id);
    setSelectedOptions(computeInitialSelectedOptions(variant, optionGroups, requiredGroups));
  } else {
    setSelectedVariantId(initialVariant?.id || variants?.[0]?.id);
  }
}

// Pick the variant to add for the desktop auto-add path.
export function pickDesktopAutoAddVariant(
  initialVariant: ProductVariant | null,
  resolvedProduct: ProductWithDetails,
): { variant: ProductVariant | null; allowed: boolean } {
  const defaultVariant = initialVariant ?? resolvedProduct.variants?.[0] ?? null;
  const hasVars = resolvedProduct.variants && resolvedProduct.variants.length > 0;
  if (hasVars && !defaultVariant) return { variant: null, allowed: false };
  const stockNow = defaultVariant?.stock_quantity ?? resolvedProduct.stock_quantity;
  if (stockNow <= 0) return { variant: defaultVariant, allowed: false };
  return { variant: defaultVariant, allowed: true };
}
