import type { OptionGroup, ProductVariant } from "@/lib/queries/products";

/**
 * Build the variant name "X / Y / Z" from selected option values. Returns
 * null when any required group is unselected. Optional values are appended
 * in their original order; required values always come first.
 */
export function buildVariantName(
  options: Record<string, string>,
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
): string | null {
  const parts = requiredGroups.map((g) => options[g.type]);
  if (parts.some((v) => !v)) return null;
  for (const og of optionalGroups) {
    if (options[og.type]) parts.push(options[og.type]);
  }
  return parts.join(" / ");
}

interface MatchResult {
  options: Record<string, string>;
  variantId: string | null;
}

/**
 * Mutate `newOptions` per the user pick. Toggles optional groups off when
 * the user re-clicks the same value; otherwise sets the group to the
 * new value.
 */
function applyOptionPick(
  selectedOptions: Record<string, string>,
  groupType: string,
  value: string,
  optionalGroups: OptionGroup[],
): Record<string, string> {
  const isOptional = optionalGroups.some((g) => g.type === groupType);
  const next = { ...selectedOptions };
  if (isOptional && selectedOptions[groupType] === value) {
    delete next[groupType];
    return next;
  }
  next[groupType] = value;
  return next;
}

/**
 * Keep the user-chosen value, try different values for other required
 * groups, return the first in-stock combination found. Returns `null`
 * if no alternate exists.
 */
function findAlternateInStockVariant(
  newOptions: Record<string, string>,
  variants: ProductVariant[],
  requiredGroups: OptionGroup[],
  optionalGroups: OptionGroup[],
  pickedGroupType: string,
): MatchResult | null {
  const adjusted = { ...newOptions };
  for (const rg of requiredGroups) {
    if (rg.type === pickedGroupType) continue;
    for (const altValue of rg.values) {
      if (altValue === newOptions[rg.type]) continue;
      adjusted[rg.type] = altValue;
      const altName = buildVariantName(adjusted, requiredGroups, optionalGroups);
      if (!altName) continue;
      const altVariant = variants.find((v) => v.name === altName);
      if (altVariant && altVariant.stock_quantity > 0) {
        return { options: { ...adjusted }, variantId: altVariant.id };
      }
    }
    adjusted[rg.type] = newOptions[rg.type]; // reset before trying next group
  }
  return null;
}

/**
 * Resolve which variant + option set to select when the user picks a new
 * value. Walks: (1) exact match in-stock → use it; (2) try alternates in
 * other required groups → first in-stock match wins; (3) fall back to the
 * user's chosen options even if out of stock (the UI shows "Дууссан").
 *
 * Extracted from ProductVariants so the picker UI stays focused on render.
 */
export function findBestVariantMatch(input: {
  groupType: string;
  value: string;
  selectedOptions: Record<string, string>;
  variants: ProductVariant[] | undefined;
  requiredGroups: OptionGroup[];
  optionalGroups: OptionGroup[];
}): MatchResult {
  const { groupType, value, selectedOptions, variants, requiredGroups, optionalGroups } = input;

  const newOptions = applyOptionPick(selectedOptions, groupType, value, optionalGroups);
  if (!variants) return { options: newOptions, variantId: null };

  const expectedName = buildVariantName(newOptions, requiredGroups, optionalGroups);
  if (!expectedName) return { options: newOptions, variantId: null };

  const exact = variants.find((v) => v.name === expectedName);
  if (exact && exact.stock_quantity > 0) {
    return { options: newOptions, variantId: exact.id };
  }

  const alternate = findAlternateInStockVariant(
    newOptions,
    variants,
    requiredGroups,
    optionalGroups,
    groupType,
  );
  if (alternate) return alternate;

  return { options: newOptions, variantId: exact?.id ?? null };
}
