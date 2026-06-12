// Pure resolver: given a selected option map + group definitions + the
// variants list, returns which variant should be applied (if any) when
// the user has chosen all groups. Pulled out of VariantEditSheet so the
// component's complexity stays under the limit.

import type { OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

export type VariantSelectionStep =
  | { kind: "expand_next"; nextIndex: number }
  | { kind: "incomplete" }
  | { kind: "no_match" }
  | { kind: "match"; variant: ProductVariant };

interface ResolveInput {
  groupType: string;
  value: string;
  selectedOptions: Record<string, string>;
  optionGroups: OptionGroup[];
  variants: ProductVariant[];
}

/**
 * Decide what to do after the user selects `value` in `groupType`:
 *  - "expand_next": this is not the last group, parent should expand the
 *    next group accordion.
 *  - "incomplete": user already selected the last group but earlier groups
 *    are still missing (shouldn't normally happen but defensive).
 *  - "no_match": full selection, but no variant fits the combination.
 *  - "match": full selection, returned variant is the one to apply.
 *
 * The returned `selectedOptions` is the new map (merged) — caller stores it.
 */
export function resolveVariantSelectionStep(input: ResolveInput): {
  step: VariantSelectionStep;
  selectedOptions: Record<string, string>;
} {
  const newOptions = { ...input.selectedOptions, [input.groupType]: input.value };

  const currentIndex = input.optionGroups.findIndex((g) => g.type === input.groupType);
  if (currentIndex < input.optionGroups.length - 1) {
    return {
      step: { kind: "expand_next", nextIndex: currentIndex + 1 },
      selectedOptions: newOptions,
    };
  }

  const expectedValues = input.optionGroups.map((group) => newOptions[group.type]);
  if (expectedValues.some((v) => !v)) {
    return { step: { kind: "incomplete" }, selectedOptions: newOptions };
  }

  const matchingVariant = input.variants.find((v) => {
    if (!v.option_values || v.option_values.length !== expectedValues.length) {
      return false;
    }
    return v.option_values.every((val, idx) => val === expectedValues[idx]);
  });

  if (!matchingVariant) {
    return { step: { kind: "no_match" }, selectedOptions: newOptions };
  }

  return {
    step: { kind: "match", variant: matchingVariant },
    selectedOptions: newOptions,
  };
}
