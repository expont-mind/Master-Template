"use client";

// State hook for VariantEditSheet. Owns:
//   - the selectedOptions map driven by user clicks
//   - the expandedGroupIndex accordion state
//   - the option-out-of-stock predicate (memoised)
//   - the open/close visibility transition
//   - body-scroll lock + Escape-to-close binding
//
// Pulled out so the sheet's render function stays under 150 lines.

import { useCallback, useEffect, useState } from "react";

import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { resolveVariantSelectionStep } from "./_variantSelectionResolver";

import type { OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface UseVariantEditStateInput {
  isOpen: boolean;
  onClose: () => void;
  currentVariantId: string;
  variants: ProductVariant[] | undefined;
  optionGroups: OptionGroup[] | undefined;
  updateVariant: (cartItemId: string, variant: ProductVariant) => void;
  cartItemId: string;
}

interface UseVariantEditStateResult {
  visible: boolean;
  animate: boolean;
  selectedOptions: Record<string, string>;
  expandedGroupIndex: number;
  setExpandedGroupIndex: (i: number) => void;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  handleOptionSelect: (groupType: string, value: string) => void;
  handleFlatVariantSelect: (variant: ProductVariant) => void;
}

export function useVariantEditState({
  isOpen,
  onClose,
  currentVariantId,
  variants,
  optionGroups,
  updateVariant,
  cartItemId,
}: UseVariantEditStateInput): UseVariantEditStateResult {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useScrollLock(visible);

  // Initialize selected options from current variant.
  // Intentional one-time sync from data (Supabase-backed cart item) to local
  // form state when the sheet opens.
  useEffect(() => {
    if (!isOpen || !variants || !optionGroups) return;

    const currentVariant = variants.find((v) => v.id === currentVariantId);
    if (!currentVariant?.option_values) return;

    const options: Record<string, string> = {};
    optionGroups.forEach((group, idx) => {
      if (currentVariant.option_values && currentVariant.option_values[idx]) {
        options[group.type] = currentVariant.option_values[idx];
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOptions(options);
    setExpandedGroupIndex(0);
  }, [isOpen, variants, optionGroups, currentVariantId]);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimate(true));
      });
      return () => cancelAnimationFrame(id);
    }
    if (visible) {
      const rafId = requestAnimationFrame(() => setAnimate(false));
      const timeout = setTimeout(() => setVisible(false), 500);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, visible]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);

  const isOptionOutOfStock = useCallback(
    (groupType: string, value: string): boolean => {
      if (!optionGroups || !variants) return false;
      const groupIndex = optionGroups.findIndex((g) => g.type === groupType);
      if (groupIndex === -1) return false;
      const matching = variants.filter((v) => {
        if (!v.option_values || v.option_values.length <= groupIndex) return false;
        return v.option_values[groupIndex] === value;
      });
      return matching.length > 0 && matching.every((v) => v.stock_quantity <= 0);
    },
    [optionGroups, variants],
  );

  const handleOptionSelect = useCallback(
    (groupType: string, value: string) => {
      if (!optionGroups || !variants) {
        setSelectedOptions((prev) => ({ ...prev, [groupType]: value }));
        return;
      }

      const { step, selectedOptions: newOptions } = resolveVariantSelectionStep({
        groupType,
        value,
        selectedOptions,
        optionGroups,
        variants,
      });
      setSelectedOptions(newOptions);

      if (step.kind === "expand_next") {
        setTimeout(() => setExpandedGroupIndex(step.nextIndex), 200);
        return;
      }
      if (step.kind === "incomplete") return;

      // "match" or "no_match" — close the sheet; apply if matched.
      if (step.kind === "match" && step.variant.id !== currentVariantId) {
        updateVariant(cartItemId, step.variant);
      }
      setTimeout(() => onClose(), 300);
    },
    [selectedOptions, optionGroups, variants, currentVariantId, cartItemId, updateVariant, onClose],
  );

  const handleFlatVariantSelect = useCallback(
    (variant: ProductVariant) => {
      if (variant.id !== currentVariantId) {
        updateVariant(cartItemId, variant);
      }
      setTimeout(() => onClose(), 300);
    },
    [currentVariantId, cartItemId, updateVariant, onClose],
  );

  return {
    visible,
    animate,
    selectedOptions,
    expandedGroupIndex,
    setExpandedGroupIndex,
    isOptionOutOfStock,
    handleOptionSelect,
    handleFlatVariantSelect,
  };
}
