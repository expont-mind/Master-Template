"use client";

import { useEffect } from "react";

import { applyOpenReset, pickDesktopAutoAddVariant } from "./_useAddToCartReset";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface UseAddToCartEffectsInput {
  isOpen: boolean;
  isMobile: boolean;
  initialQuantity: number;
  initialVariant: ProductVariant | null;
  variants: ProductVariant[] | null | undefined;
  optionGroups: OptionGroup[] | undefined;
  requiredGroups: OptionGroup[];
  resolvedProduct: ProductWithDetails;
  hasAddedToCart: boolean;
  isLoadingDetails: boolean;
  addItem: (product: ProductWithDetails, quantity: number, variant: ProductVariant | null) => void;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  setHasAddedToCart: React.Dispatch<React.SetStateAction<boolean>>;
  setCartItems: React.Dispatch<React.SetStateAction<StagedCartItem[]>>;
  setEditingCartItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setMobilePhase: React.Dispatch<React.SetStateAction<"accordion" | "summary">>;
  setExpandedGroupIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedVariantId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setSelectedOptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function useAddToCartEffects(input: UseAddToCartEffectsInput) {
  const {
    isOpen,
    isMobile,
    initialQuantity,
    initialVariant,
    variants,
    optionGroups,
    requiredGroups,
    resolvedProduct,
    hasAddedToCart,
    isLoadingDetails,
    addItem,
    setQuantity,
    setHasAddedToCart,
    setCartItems,
    setEditingCartItemId,
    setMobilePhase,
    setExpandedGroupIndex,
    setSelectedVariantId,
    setSelectedOptions,
  } = input;

  // Initialize when modal opens
  useEffect(() => {
    if (!isOpen) return;
    applyOpenReset({
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
    });
  }, [
    isOpen,
    initialQuantity,
    initialVariant,
    optionGroups,
    variants,
    requiredGroups,
    setQuantity,
    setHasAddedToCart,
    setCartItems,
    setEditingCartItemId,
    setMobilePhase,
    setExpandedGroupIndex,
    setSelectedVariantId,
    setSelectedOptions,
  ]);

  // Desktop: auto-add when modal opens (wait for variant data if fetching)
  useEffect(() => {
    if (!(isOpen && !isMobile && !hasAddedToCart && !isLoadingDetails)) return;
    const { variant, allowed } = pickDesktopAutoAddVariant(initialVariant, resolvedProduct);
    if (!allowed) return;
    addItem(resolvedProduct, initialQuantity, variant);
    // setHasAddedToCart is a one-shot guard preventing this effect from
    // re-firing once the desktop auto-add completes.
    setHasAddedToCart(true);
  }, [
    isOpen,
    isMobile,
    hasAddedToCart,
    isLoadingDetails,
    addItem,
    resolvedProduct,
    initialQuantity,
    initialVariant,
    setHasAddedToCart,
  ]);
}
