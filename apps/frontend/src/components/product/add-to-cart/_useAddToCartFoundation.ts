"use client";

import { useMemo, useState } from "react";

import { useProductDetail } from "@/lib/hooks/useProductDetail";

import { computeDisplayPricing } from "./_addToCartHelpers";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface UseAddToCartFoundationInput {
  isOpen: boolean;
  product: ProductWithDetails;
  initialQuantity: number;
  initialVariant: ProductVariant | null;
}

export function useAddToCartFoundation({
  isOpen,
  product,
  initialQuantity,
  initialVariant,
}: UseAddToCartFoundationInput) {
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    initialVariant?.id,
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [mobilePhase, setMobilePhase] = useState<"accordion" | "summary">("accordion");
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>(0);
  const [cartItems, setCartItems] = useState<StagedCartItem[]>([]);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);

  // Fetch full product details when variants are missing (e.g., from ProductCard)
  const needsFetch = isOpen && product.variants === undefined;
  const { data: fetchedProduct, isLoading: isLoadingDetails } = useProductDetail(
    needsFetch ? product.slug : "",
  );
  const resolvedProduct = (fetchedProduct ?? product) as ProductWithDetails;

  const variants = resolvedProduct.variants;
  const optionGroups = resolvedProduct.option_groups as OptionGroup[] | undefined;
  const hasVariants = !!(variants && variants.length > 0);
  const hasOptionGroups = !!(optionGroups && optionGroups.length > 0);

  const requiredGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required !== false) ?? [],
    [optionGroups],
  );
  const optionalGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required === false) ?? [],
    [optionGroups],
  );
  const allAccordionGroups = useMemo(
    () => [...requiredGroups, ...optionalGroups],
    [requiredGroups, optionalGroups],
  );

  const selectedVariant = hasVariants
    ? variants!.find((v) => v.id === selectedVariantId) || variants![0]
    : null;

  const pricing = computeDisplayPricing(selectedVariant, resolvedProduct);

  return {
    // raw state
    hasAddedToCart,
    contentVisible,
    quantity,
    selectedVariantId,
    selectedOptions,
    mobilePhase,
    expandedGroupIndex,
    cartItems,
    editingCartItemId,
    // setters
    setHasAddedToCart,
    setContentVisible,
    setQuantity,
    setSelectedVariantId,
    setSelectedOptions,
    setMobilePhase,
    setExpandedGroupIndex,
    setCartItems,
    setEditingCartItemId,
    // resolved product + derived
    resolvedProduct,
    isLoadingDetails,
    variants,
    optionGroups,
    hasVariants,
    hasOptionGroups,
    requiredGroups,
    optionalGroups,
    allAccordionGroups,
    selectedVariant,
    pricing,
  };
}
