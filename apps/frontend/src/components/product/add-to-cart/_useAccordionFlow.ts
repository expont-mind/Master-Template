"use client";

// Sub-hook of useAddToCartState — encapsulates the mobile accordion
// navigation handlers and the variant finalization step. The owning hook
// supplies the relevant state slices and pure helpers.

import { useCallback } from "react";

import { mergeStagedItem, replaceEditingItem } from "./_addToCartHelpers";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface UseAccordionFlowInput {
  variants: ProductVariant[] | null | undefined;
  allAccordionGroups: OptionGroup[];
  selectedOptions: Record<string, string>;
  editingCartItemId: string | null;
  setEditingCartItemId: (id: string | null) => void;
  setCartItems: React.Dispatch<React.SetStateAction<StagedCartItem[]>>;
  setSelectedVariantId: (id: string | undefined) => void;
  setExpandedGroupIndex: (i: number) => void;
  setMobilePhase: (p: "accordion" | "summary") => void;
  buildVariantName: (options: Record<string, string>) => string | null;
  handleOptionSelect: (groupType: string, value: string) => void;
  slideTransition: (callback: () => void) => void;
}

export function useAccordionFlow({
  variants,
  allAccordionGroups,
  selectedOptions,
  editingCartItemId,
  setEditingCartItemId,
  setCartItems,
  setSelectedVariantId,
  setExpandedGroupIndex,
  setMobilePhase,
  buildVariantName,
  handleOptionSelect,
  slideTransition,
}: UseAccordionFlowInput) {
  const finalizeVariantSelection = useCallback(
    (finalOptions: Record<string, string>) => {
      if (!variants) return;
      const expectedName = buildVariantName(finalOptions);
      if (!expectedName) return;
      const matchingVariant = variants.find((v) => v.name === expectedName);
      if (!matchingVariant) return;

      setCartItems((prev) =>
        editingCartItemId
          ? replaceEditingItem(prev, editingCartItemId, matchingVariant.id, finalOptions)
          : mergeStagedItem(prev, matchingVariant.id, finalOptions, 1),
      );
      if (editingCartItemId) setEditingCartItemId(null);

      slideTransition(() => {
        setExpandedGroupIndex(-1);
        setMobilePhase("summary");
      });
    },
    [
      buildVariantName,
      variants,
      editingCartItemId,
      slideTransition,
      setCartItems,
      setEditingCartItemId,
      setExpandedGroupIndex,
      setMobilePhase,
    ],
  );

  const handleAccordionOptionSelect = useCallback(
    (groupType: string, value: string) => {
      handleOptionSelect(groupType, value);
      const currentIndex = allAccordionGroups.findIndex((g) => g.type === groupType);
      if (currentIndex === -1) return;
      if (currentIndex < allAccordionGroups.length - 1) {
        setTimeout(() => setExpandedGroupIndex(currentIndex + 1), 200);
      } else {
        const newOptions = { ...selectedOptions, [groupType]: value };
        finalizeVariantSelection(newOptions);
      }
    },
    [
      handleOptionSelect,
      allAccordionGroups,
      selectedOptions,
      finalizeVariantSelection,
      setExpandedGroupIndex,
    ],
  );

  const handleSkipOptionalGroup = useCallback(
    (groupIndex: number) => {
      if (groupIndex < allAccordionGroups.length - 1) {
        setExpandedGroupIndex(groupIndex + 1);
      } else {
        finalizeVariantSelection(selectedOptions);
      }
    },
    [allAccordionGroups, selectedOptions, finalizeVariantSelection, setExpandedGroupIndex],
  );

  const handleAccordionVariantSelect = useCallback(
    (variantId: string) => {
      setSelectedVariantId(variantId);
      setCartItems((prev) => mergeStagedItem(prev, variantId, {}, 1));
      slideTransition(() => setMobilePhase("summary"));
    },
    [slideTransition, setCartItems, setSelectedVariantId, setMobilePhase],
  );

  return {
    handleAccordionOptionSelect,
    handleSkipOptionalGroup,
    handleAccordionVariantSelect,
  };
}
