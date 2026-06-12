"use client";

// State and handlers for AddToCartModal. This hook composes foundation
// state, effects, selection handlers, accordion flow, and cart-item
// handlers from sibling sub-hooks.

import { useMemo } from "react";

import { useCartStore } from "@/stores/cart-store";

import { computeTotalPrice } from "./_addToCartHelpers";
import { useAccordionFlow } from "./_useAccordionFlow";
import { useAddToCartEffects } from "./_useAddToCartEffects";
import { useAddToCartFoundation } from "./_useAddToCartFoundation";
import { useAddToCartSelection } from "./_useAddToCartSelection";
import { useCartItemHandlers } from "./_useCartItemHandlers";

import type { ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

export type { StagedCartItem } from "./_addToCartTypes";

interface UseAddToCartStateInput {
  isOpen: boolean;
  isMobile: boolean;
  product: ProductWithDetails;
  initialQuantity: number;
  initialVariant: ProductVariant | null;
}

export function useAddToCartState({
  isOpen,
  isMobile,
  product,
  initialQuantity,
  initialVariant,
}: UseAddToCartStateInput) {
  const addItem = useCartStore((s) => s.addItem);

  const f = useAddToCartFoundation({
    isOpen,
    product,
    initialQuantity,
    initialVariant,
  });

  useAddToCartEffects({
    isOpen,
    isMobile,
    initialQuantity,
    initialVariant,
    variants: f.variants,
    optionGroups: f.optionGroups,
    requiredGroups: f.requiredGroups,
    resolvedProduct: f.resolvedProduct,
    hasAddedToCart: f.hasAddedToCart,
    isLoadingDetails: f.isLoadingDetails,
    addItem,
    setQuantity: f.setQuantity,
    setHasAddedToCart: f.setHasAddedToCart,
    setCartItems: f.setCartItems,
    setEditingCartItemId: f.setEditingCartItemId,
    setMobilePhase: f.setMobilePhase,
    setExpandedGroupIndex: f.setExpandedGroupIndex,
    setSelectedVariantId: f.setSelectedVariantId,
    setSelectedOptions: f.setSelectedOptions,
  });

  const selection = useAddToCartSelection({
    variants: f.variants,
    requiredGroups: f.requiredGroups,
    optionalGroups: f.optionalGroups,
    selectedOptions: f.selectedOptions,
    selectedVariant: f.selectedVariant,
    resolvedProduct: f.resolvedProduct,
    quantity: f.quantity,
    hasVariants: f.hasVariants,
    cartItems: f.cartItems,
    currentStock: f.pricing.currentStock,
    addItem,
    setSelectedOptions: f.setSelectedOptions,
    setSelectedVariantId: f.setSelectedVariantId,
    setQuantity: f.setQuantity,
    setHasAddedToCart: f.setHasAddedToCart,
    setContentVisible: f.setContentVisible,
  });

  const accordion = useAccordionFlow({
    variants: f.variants,
    allAccordionGroups: f.allAccordionGroups,
    selectedOptions: f.selectedOptions,
    editingCartItemId: f.editingCartItemId,
    setEditingCartItemId: f.setEditingCartItemId,
    setCartItems: f.setCartItems,
    setSelectedVariantId: f.setSelectedVariantId,
    setExpandedGroupIndex: f.setExpandedGroupIndex,
    setMobilePhase: f.setMobilePhase,
    buildVariantName: selection.buildVariantName,
    handleOptionSelect: selection.handleOptionSelect,
    slideTransition: selection.slideTransition,
  });

  const cartItemHandlers = useCartItemHandlers({
    variants: f.variants,
    setCartItems: f.setCartItems,
    setMobilePhase: f.setMobilePhase,
    setExpandedGroupIndex: f.setExpandedGroupIndex,
    setSelectedOptions: f.setSelectedOptions,
    setSelectedVariantId: f.setSelectedVariantId,
    setEditingCartItemId: f.setEditingCartItemId,
    slideTransition: selection.slideTransition,
  });

  const totalPrice = useMemo(
    () =>
      computeTotalPrice(
        f.cartItems,
        f.variants,
        f.resolvedProduct,
        f.pricing.sellingPrice,
        f.quantity,
      ),
    [f.cartItems, f.variants, f.resolvedProduct, f.pricing.sellingPrice, f.quantity],
  );

  const canDecrease = f.quantity > 1;
  const canIncrease = f.pricing.currentStock == null || f.quantity < f.pricing.currentStock;

  return {
    resolvedProduct: f.resolvedProduct,
    variants: f.variants,
    optionGroups: f.optionGroups,
    hasVariants: f.hasVariants,
    hasOptionGroups: f.hasOptionGroups,
    selectedVariant: f.selectedVariant,
    ...f.pricing,
    hasAddedToCart: f.hasAddedToCart,
    contentVisible: f.contentVisible,
    quantity: f.quantity,
    selectedOptions: f.selectedOptions,
    selectedVariantId: f.selectedVariantId,
    mobilePhase: f.mobilePhase,
    expandedGroupIndex: f.expandedGroupIndex,
    cartItems: f.cartItems,
    canDecrease,
    canIncrease,
    totalPrice,
    allAccordionGroups: f.allAccordionGroups,
    setExpandedGroupIndex: f.setExpandedGroupIndex,
    handleQuantityChange: selection.handleQuantityChange,
    handleAccordionOptionSelect: accordion.handleAccordionOptionSelect,
    handleAccordionVariantSelect: accordion.handleAccordionVariantSelect,
    handleSkipOptionalGroup: accordion.handleSkipOptionalGroup,
    handleCartItemQuantityChange: cartItemHandlers.handleCartItemQuantityChange,
    handleRemoveCartItem: cartItemHandlers.handleRemoveCartItem,
    handleMobileAddToCart: selection.handleMobileAddToCart,
    isOptionOutOfStock: selection.isOptionOutOfStock,
    getOptionImage: selection.getOptionImage,
    backToAccordion: cartItemHandlers.backToAccordion,
    editCartItem: cartItemHandlers.editCartItem,
  };
}
