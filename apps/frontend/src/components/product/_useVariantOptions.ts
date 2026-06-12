"use client";

import { useCallback, useMemo, useState } from "react";

import { findBestVariantMatch } from "./_variantSelection";

import type { OptionGroup, ProductVariant } from "@/lib/queries/products";

interface UseVariantOptionsArgs {
  optionGroups: OptionGroup[] | undefined;
  variants: ProductVariant[] | undefined;
  selectedVariantId: string | undefined;
  onVariantChange: ((variantId: string) => void) | undefined;
}

/**
 * Encapsulates option-group selection state for ProductVariants.
 * Tracks user overrides, derives current selections, and resolves
 * the best matching variant on each click.
 */
export function useVariantOptions({
  optionGroups,
  variants,
  selectedVariantId,
  onVariantChange,
}: UseVariantOptionsArgs) {
  const requiredGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required !== false) ?? [],
    [optionGroups],
  );
  const optionalGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required === false) ?? [],
    [optionGroups],
  );

  const groupPositions = useMemo(() => {
    const positions = new Map<string, number>();
    requiredGroups.forEach((g, i) => positions.set(g.type, i));
    optionalGroups.forEach((g, i) => positions.set(g.type, requiredGroups.length + i));
    return positions;
  }, [requiredGroups, optionalGroups]);

  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<string, string> | null>(
    null,
  );

  // Compute selected options synchronously: user overrides win; otherwise
  // derive from the currently selected variant's option_values.
  const selectedOptions = useMemo(() => {
    if (userSelectedOptions !== null) return userSelectedOptions;
    if (!optionGroups || optionGroups.length === 0 || !variants) return {};

    const selectedVariant = variants.find((v) => v.id === selectedVariantId);
    const options: Record<string, string> = {};

    if (selectedVariant?.option_values && selectedVariant.option_values.length > 0) {
      requiredGroups.forEach((group, idx) => {
        if (selectedVariant.option_values?.[idx]) {
          options[group.type] = selectedVariant.option_values[idx];
        }
      });
    } else {
      requiredGroups.forEach((group) => {
        if (group.values.length > 0) {
          options[group.type] = group.values[0];
        }
      });
    }
    return options;
  }, [userSelectedOptions, optionGroups, variants, selectedVariantId, requiredGroups]);

  const handleOptionSelect = useCallback(
    (groupType: string, value: string) => {
      const result = findBestVariantMatch({
        groupType,
        value,
        selectedOptions,
        variants,
        requiredGroups,
        optionalGroups,
      });
      setUserSelectedOptions(result.options);
      if (result.variantId && result.variantId !== selectedVariantId) {
        onVariantChange?.(result.variantId);
      }
    },
    [selectedOptions, variants, requiredGroups, optionalGroups, selectedVariantId, onVariantChange],
  );

  return {
    requiredGroups,
    optionalGroups,
    groupPositions,
    selectedOptions,
    handleOptionSelect,
  };
}

function resolvePositionIndex(
  group: OptionGroup,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): number {
  const isOptional = group.is_required === false;
  return isOptional
    ? requiredGroups.length + optionalGroups.findIndex((g) => g.type === group.type)
    : requiredGroups.findIndex((g) => g.type === group.type);
}

export function getVariantImageForValue(
  value: string,
  group: OptionGroup,
  variants: ProductVariant[] | undefined,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): string | null {
  if (!variants) return null;
  const posIndex = resolvePositionIndex(group, requiredGroups, optionalGroups);
  const matching = variants.find(
    (v) =>
      v.option_values && v.option_values.length > posIndex && v.option_values[posIndex] === value,
  );
  return matching?.images?.[0] ?? null;
}

export function isValueOutOfStock(
  value: string,
  group: OptionGroup,
  variants: ProductVariant[] | undefined,
  selectedOptions: Record<string, string>,
  groupPositions: Map<string, number>,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): boolean {
  if (!variants) return false;
  const posIndex = resolvePositionIndex(group, requiredGroups, optionalGroups);

  let matching = variants.filter(
    (v) =>
      v.option_values && v.option_values.length > posIndex && v.option_values[posIndex] === value,
  );

  // Context-aware: also filter by selections from OTHER groups
  for (const [otherType, otherValue] of Object.entries(selectedOptions)) {
    if (otherType === group.type) continue;
    const otherPos = groupPositions.get(otherType);
    if (otherPos === undefined) continue;
    matching = matching.filter(
      (v) =>
        v.option_values &&
        v.option_values.length > otherPos &&
        v.option_values[otherPos] === otherValue,
    );
  }

  return matching.length > 0 && matching.every((v) => v.stock_quantity <= 0);
}
