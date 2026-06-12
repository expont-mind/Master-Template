// Helpers that translate a server `Product` payload into the form-state
// shape used by useProductEdit. Used for both editing an existing product
// and duplicating a source product.

import { buildAllVariantCombinations, generateSku } from "./_helpers";

import type {
  Product,
  ProductVariant,
  GeneratedVariant,
  OptionGroup,
} from "@/components/product/types";

type OptionMetadata = {
  option_groups?: Array<{ type: string; values: string[]; is_required?: boolean }>;
};

export function getProductImages(data: Product): string[] {
  return (data.product_images || [])
    .filter((img) => !img.variant_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url);
}

export function getCategoryIds(data: Product): string[] {
  return (data.product_categories || []).map((pc) => pc.category_id);
}

export function getOptionGroupsFromMetadata(data: Product): OptionGroup[] {
  const metadata = data.metadata as OptionMetadata | null;
  if (!metadata?.option_groups || !Array.isArray(metadata.option_groups)) {
    return [];
  }
  return metadata.option_groups.map((g, idx) => ({
    id: `group-${Date.now()}-${idx}`,
    type: g.type,
    values: g.values,
    is_required: g.is_required !== false,
  }));
}

function buildVariantNameMaps(data: Product): {
  variantNameToData: Map<string, ProductVariant>;
  variantIdToName: Map<string, string>;
} {
  const variantNameToData = new Map<string, ProductVariant>();
  const variantIdToName = new Map<string, string>();
  for (const v of data.product_variants || []) {
    if (v.name) {
      variantNameToData.set(v.name, v);
      variantIdToName.set(v.id, v.name);
    }
  }
  return { variantNameToData, variantIdToName };
}

function buildVariantImageMap(
  data: Product,
  variantIdToName: Map<string, string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const img of data.product_images || []) {
    if (!img.variant_id) continue;
    const variantName = variantIdToName.get(img.variant_id);
    if (variantName && !map.has(variantName)) {
      map.set(variantName, img.url);
    }
  }
  return map;
}

type BuildGeneratedVariantsOptions = {
  /** Use a fresh ID instead of reusing existing variant ID (for duplicate) */
  freshIds: boolean;
};

type VariantBuildContext = {
  data: Product;
  freshIds: boolean;
  variantNameToData: Map<string, ProductVariant>;
  variantNameToImage: Map<string, string>;
};

function resolveVariantId(
  existing: ProductVariant | undefined,
  tempId: string,
  freshIds: boolean,
): string {
  if (freshIds) return tempId;
  return existing?.id ?? tempId;
}

function resolveVariantSku(existing: ProductVariant | undefined, freshIds: boolean): string {
  if (freshIds) return generateSku();
  return existing?.sku ?? generateSku();
}

function resolveVariantPrice(
  existing: ProductVariant | undefined,
  fallback: number | undefined,
): string {
  const fromExisting = existing?.price?.toString();
  if (fromExisting) return fromExisting;
  return fallback?.toString() ?? "";
}

function buildOneGeneratedVariant(
  combo: string[],
  idx: number,
  ctx: VariantBuildContext,
): GeneratedVariant {
  const combinationStr = combo.join(" / ");
  const existing = ctx.variantNameToData.get(combinationStr);
  const tempId = `variant-${Date.now()}-${idx}`;
  return {
    id: resolveVariantId(existing, tempId, ctx.freshIds),
    combination: combinationStr,
    optionValues: combo,
    price: resolveVariantPrice(existing, ctx.data.price),
    discountPrice: existing?.discount_price?.toString() ?? "",
    stockQuantity: existing?.stock_quantity?.toString() ?? "",
    sku: resolveVariantSku(existing, ctx.freshIds),
    status: (existing?.status as "active" | "inactive") ?? "active",
    imageUrl: ctx.variantNameToImage.get(combinationStr) ?? "",
  };
}

export function buildGeneratedVariants(
  data: Product,
  opts: BuildGeneratedVariantsOptions,
): GeneratedVariant[] {
  const metadata = data.metadata as OptionMetadata | null;
  if (!metadata?.option_groups || !Array.isArray(metadata.option_groups)) {
    return [];
  }

  const { variantNameToData, variantIdToName } = buildVariantNameMaps(data);
  const variantNameToImage = buildVariantImageMap(data, variantIdToName);
  const allCombinations = buildAllVariantCombinations(metadata.option_groups);
  const ctx: VariantBuildContext = {
    data,
    freshIds: opts.freshIds,
    variantNameToData,
    variantNameToImage,
  };

  return allCombinations.map((combo, idx) => buildOneGeneratedVariant(combo, idx, ctx));
}
