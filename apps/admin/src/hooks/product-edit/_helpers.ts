// Pure helpers for the product-edit hook tree.
// No React, no localStorage — safe to import from anywhere.

import type { VariantForm } from "@/components/product/types";

/**
 * Generate every variant combination from option groups, including the
 * base (all required options) plus every subset of optional options.
 *
 * Example: required color={red,blue} + optional size={S,M} →
 *   [red], [blue], [red,S], [red,M], [blue,S], [blue,M]
 */
export function buildAllVariantCombinations(
  optionGroups: Array<{ type: string; values: string[]; is_required?: boolean }>,
): string[][] {
  const requiredGroups = optionGroups.filter((g) => g.values.length > 0 && g.is_required !== false);
  const optionalGroups = optionGroups.filter((g) => g.values.length > 0 && g.is_required === false);
  if (requiredGroups.length === 0) return [];

  const baseCombinations: string[][] = requiredGroups.reduce<string[][]>((acc, group) => {
    if (acc.length === 0) return group.values.map((v) => [v]);
    return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
  }, []);

  const allCombinations: string[][] = [...baseCombinations];

  if (optionalGroups.length > 0) {
    for (let i = 1; i < 1 << optionalGroups.length; i++) {
      const subset: typeof optionalGroups = [];
      for (let j = 0; j < optionalGroups.length; j++) {
        if (i & (1 << j)) subset.push(optionalGroups[j]);
      }
      const optCombinations = subset.reduce<string[][]>((acc, group) => {
        if (acc.length === 0) return group.values.map((v) => [v]);
        return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
      }, []);
      for (const base of baseCombinations) {
        for (const opt of optCombinations) {
          allCombinations.push([...base, ...opt]);
        }
      }
    }
  }

  return allCombinations;
}

export function generateSku(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKU-${timestamp}${random}`;
}

export function createEmptyVariant(): VariantForm {
  return {
    id: crypto.randomUUID(),
    sku: generateSku(),
    name: "",
    price: "",
    discountPrice: "",
    stockQuantity: "",
    attributes: {},
    images: [],
    details: [],
  };
}
