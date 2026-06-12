"use client";

import { useCallback } from "react";

import {
  buildVariantName as buildVariantNamePure,
  getOptionImage as getOptionImagePure,
  isOptionOutOfStock as isOptionOutOfStockPure,
} from "./_addToCartHelpers";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface UseAddToCartSelectionInput {
  variants: ProductVariant[] | null | undefined;
  requiredGroups: OptionGroup[];
  optionalGroups: OptionGroup[];
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant | null;
  resolvedProduct: ProductWithDetails;
  quantity: number;
  hasVariants: boolean;
  cartItems: StagedCartItem[];
  currentStock: number | null | undefined;
  addItem: (product: ProductWithDetails, quantity: number, variant: ProductVariant | null) => void;
  setSelectedOptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedVariantId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  setHasAddedToCart: React.Dispatch<React.SetStateAction<boolean>>;
  setContentVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useAddToCartSelection(input: UseAddToCartSelectionInput) {
  const {
    variants,
    requiredGroups,
    optionalGroups,
    selectedOptions,
    selectedVariant,
    resolvedProduct,
    quantity,
    hasVariants,
    cartItems,
    currentStock,
    addItem,
    setSelectedOptions,
    setSelectedVariantId,
    setQuantity,
    setHasAddedToCart,
    setContentVisible,
  } = input;

  const buildVariantName = useCallback(
    (options: Record<string, string>) =>
      buildVariantNamePure(options, requiredGroups, optionalGroups),
    [requiredGroups, optionalGroups],
  );

  const handleOptionSelect = useCallback(
    (groupType: string, value: string) => {
      const isOptional = optionalGroups.some((g) => g.type === groupType);
      const newOptions = { ...selectedOptions };
      if (isOptional && selectedOptions[groupType] === value) {
        delete newOptions[groupType];
      } else {
        newOptions[groupType] = value;
      }
      setSelectedOptions(newOptions);

      if (!variants) return;
      const expectedName = buildVariantName(newOptions);
      if (!expectedName) return;
      const matchingVariant = variants.find((v) => v.name === expectedName);
      if (matchingVariant) setSelectedVariantId(matchingVariant.id);
    },
    [
      selectedOptions,
      optionalGroups,
      buildVariantName,
      variants,
      setSelectedOptions,
      setSelectedVariantId,
    ],
  );

  const handleQuantityChange = useCallback(
    (delta: number) => {
      setQuantity((prev) => {
        let next = prev + delta;
        next = Math.max(1, next);
        if (currentStock != null) next = Math.min(currentStock, next);
        return next;
      });
    },
    [currentStock, setQuantity],
  );

  const slideTransition = useCallback(
    (callback: () => void) => {
      setContentVisible(false);
      setTimeout(() => {
        callback();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setContentVisible(true));
        });
      }, 200);
    },
    [setContentVisible],
  );

  const handleMobileAddToCart = useCallback(() => {
    if (hasVariants && cartItems.length > 0) {
      cartItems.forEach((item) => {
        const variant = variants?.find((v) => v.id === item.variantId) || null;
        if (!variant) return;
        // Skip items whose variant ran out of stock after the user staged them
        if (variant.stock_quantity <= 0) return;
        addItem(resolvedProduct, item.quantity, variant);
      });
    } else {
      if (hasVariants && !selectedVariant) return;
      const stockNow = selectedVariant?.stock_quantity ?? resolvedProduct.stock_quantity;
      if (stockNow <= 0) return;
      addItem(resolvedProduct, quantity, selectedVariant);
    }
    slideTransition(() => setHasAddedToCart(true));
  }, [
    addItem,
    resolvedProduct,
    quantity,
    selectedVariant,
    hasVariants,
    cartItems,
    variants,
    slideTransition,
    setHasAddedToCart,
  ]);

  const isOptionOutOfStock = useCallback(
    (groupType: string, value: string) =>
      isOptionOutOfStockPure(groupType, value, variants, requiredGroups, optionalGroups),
    [variants, requiredGroups, optionalGroups],
  );

  const getOptionImage = useCallback(
    (groupType: string, value: string) =>
      getOptionImagePure(groupType, value, variants, requiredGroups, optionalGroups),
    [variants, requiredGroups, optionalGroups],
  );

  return {
    buildVariantName,
    handleOptionSelect,
    handleQuantityChange,
    slideTransition,
    handleMobileAddToCart,
    isOptionOutOfStock,
    getOptionImage,
  };
}
