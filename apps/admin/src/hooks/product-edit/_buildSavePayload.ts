import type { ProductDetail } from "./_draft";
import type { VariantForm, GeneratedVariant, OptionGroup } from "@/components/product/types";
import type { ProductStatus } from "@/types/database";

type PayloadInput = {
  id: string;
  isNew: boolean;
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  brandId: string | null;
  originalUrl: string;
  images: string[];
  categoryIds: string[];
  variants: VariantForm[];
  productDetails: ProductDetail[];
  richDescription: string;
  richImages: string[];
  optionGroups: OptionGroup[];
  generatedVariants: GeneratedVariant[];
  slugFallback: () => string;
};

type VariantPayload = {
  id: string | null;
  sku: string | null;
  name: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default: boolean;
  status: string;
  images: { url: string }[];
  option_values: string[];
};

function buildVariantPayloads(
  optionGroups: OptionGroup[],
  generatedVariants: GeneratedVariant[],
): VariantPayload[] {
  const hasOptions = optionGroups.length > 0 && generatedVariants.length > 0;
  if (!hasOptions) return [];

  const seen = new Set<string>();
  return generatedVariants
    .filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    })
    .map((v, idx) => ({
      id: v.id.startsWith("variant-") ? null : v.id,
      sku: v.sku || null,
      name: v.combination || null,
      price: parseFloat(v.price) || 0,
      discount_price: v.discountPrice ? parseFloat(v.discountPrice) : null,
      stock_quantity: parseInt(v.stockQuantity) || 0,
      is_default: idx === 0,
      status: v.status || "active",
      images: v.imageUrl ? [{ url: v.imageUrl }] : [],
      option_values: v.optionValues || [],
    }));
}

export function buildSavePayload(input: PayloadInput) {
  const p_product = {
    id: input.isNew ? null : input.id,
    name: input.name.trim(),
    slug: input.slug.trim() || input.slugFallback(),
    description: input.description.trim() || null,
    price: parseFloat(input.variants[0].price),
    discount_price: input.variants[0].discountPrice
      ? parseFloat(input.variants[0].discountPrice)
      : null,
    stock_quantity: parseInt(input.variants[0].stockQuantity) || 0,
    status: input.status,
    brand_id: input.brandId,
    original_url: input.originalUrl.trim() || null,
  };

  const p_variants = buildVariantPayloads(input.optionGroups, input.generatedVariants);
  const p_images = input.images.map((url) => ({ url }));

  const p_details = input.productDetails
    .filter((d) => d.type && d.content.trim())
    .map((d) => ({ type: d.type, content: d.content.trim() }));

  const p_rich_description =
    input.richDescription.trim() || input.richImages.length > 0
      ? { content: input.richDescription.trim(), images: input.richImages }
      : null;

  const p_option_groups =
    input.optionGroups.length > 0
      ? input.optionGroups.map((g) => ({
          type: g.type,
          values: g.values,
          is_required: g.is_required,
        }))
      : null;

  return {
    p_product,
    p_variants,
    p_images,
    p_category_ids: input.categoryIds,
    p_details,
    p_rich_description,
    p_option_groups,
  };
}
