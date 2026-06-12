import { createClient } from "@/lib/supabase/client";

import type {
  OptionGroup,
  ProductBrand,
  ProductCategory,
  ProductDetail,
  ProductRichDescription,
  ProductVariant,
  ProductWithDetails,
} from "./products";

type SupabaseClient = ReturnType<typeof createClient>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Slug may be either a real slug or a raw UUID (legacy direct-id links). */
function isUuid(slug: string): boolean {
  return UUID_REGEX.test(slug);
}

interface ProductImageRow {
  id: string;
  variant_id: string | null;
  url: string;
  sort_order: number | null;
}

interface VariantRow {
  id: string;
  name: string | null;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default: boolean;
  option_values: string[] | null;
}

interface ProductRow extends Record<string, unknown> {
  id: string;
  slug: string;
  brand_id: string | null;
  metadata: { option_groups?: OptionGroup[] } | null;
}

/**
 * Locate a product by slug OR UUID, restricted to is_active=true rows.
 * Returns null on any error or missing row (used for soft-404 routing).
 */
export async function fetchProductBySlugBase(
  supabase: SupabaseClient,
  slug: string,
): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq(isUuid(slug) ? "id" : "slug", slug)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data as ProductRow;
}

interface RawDetails {
  detailsResult: { data: ProductDetail[] | null };
  variantsResult: { data: VariantRow[] | null };
  imagesResult: { data: ProductImageRow[] | null };
  richDescResult: {
    data: { content: string | null; images: string[] | null } | null;
  };
  brandResult: { data: ProductBrand | null };
  allCategoriesResult: { data: ProductCategory[] | null };
  productCategoriesResult: { data: Array<{ category_id: string }> | null };
}

/**
 * Run the 7 parallel detail fetches that feed `getProductBySlug`. Kept
 * separate so the orchestrator stays at ~20 lines.
 */
export async function fetchProductBySlugDetails(
  supabase: SupabaseClient,
  product: ProductRow,
): Promise<RawDetails> {
  const [
    detailsResult,
    variantsResult,
    imagesResult,
    richDescResult,
    brandResult,
    allCategoriesResult,
    productCategoriesResult,
  ] = await Promise.all([
    supabase
      .from("product_details")
      .select("id, type, content, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, name, sku, price, discount_price, stock_quantity, is_default, option_values")
      .eq("product_id", product.id)
      .eq("status", "active")
      .order("is_default", { ascending: false }),
    supabase
      .from("product_images")
      .select("id, variant_id, url, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_rich_descriptions")
      .select("content, images")
      .eq("product_id", product.id)
      .maybeSingle(),
    product.brand_id
      ? supabase
          .from("brands")
          .select("id, name, slug, logo_url")
          .eq("id", product.brand_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("categories").select("id, name, slug, parent_id").eq("is_active", true),
    supabase.from("product_categories").select("category_id").eq("product_id", product.id),
  ]);

  return {
    detailsResult: detailsResult as { data: ProductDetail[] | null },
    variantsResult: variantsResult as unknown as { data: VariantRow[] | null },
    imagesResult: imagesResult as { data: ProductImageRow[] | null },
    richDescResult: richDescResult as {
      data: { content: string | null; images: string[] | null } | null;
    },
    brandResult: brandResult as { data: ProductBrand | null },
    allCategoriesResult: allCategoriesResult as {
      data: ProductCategory[] | null;
    },
    productCategoriesResult: productCategoriesResult as {
      data: Array<{ category_id: string }> | null;
    },
  };
}

/**
 * Walk from each candidate category to its root via parent_id, pick the
 * deepest path, then return that path root-first. Used to render
 * breadcrumbs.
 */
export function buildCategoryPath(
  allCategories: ProductCategory[],
  productCategoryIds: string[],
): ProductCategory[] {
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
  let deepestCat: ProductCategory | undefined;
  let maxDepth = -1;

  for (const catId of productCategoryIds) {
    let depth = 0;
    let cat = categoryMap.get(catId);
    while (cat) {
      depth++;
      cat = cat.parent_id ? categoryMap.get(cat.parent_id) : undefined;
    }
    if (depth > maxDepth) {
      maxDepth = depth;
      deepestCat = categoryMap.get(catId);
    }
  }

  const path: ProductCategory[] = [];
  let currentCat: ProductCategory | undefined = deepestCat;
  while (currentCat) {
    path.unshift(currentCat);
    currentCat = currentCat.parent_id ? categoryMap.get(currentCat.parent_id) : undefined;
  }
  return path;
}

/** Variant-level images are matched to variants by `variant_id`. */
function attachVariantImages(
  variants: VariantRow[],
  allImages: ProductImageRow[],
): ProductVariant[] {
  return variants.map((v) => ({
    ...v,
    images: allImages.filter((img) => img.variant_id === v.id).map((img) => img.url),
  }));
}

function resolveCategoryPath(details: RawDetails): ProductCategory[] {
  const productCatIds = details.productCategoriesResult.data ?? [];
  if (!details.allCategoriesResult.data || productCatIds.length === 0) {
    return [];
  }
  return buildCategoryPath(
    details.allCategoriesResult.data,
    productCatIds.map((pc) => pc.category_id),
  );
}

function resolveRichDescription(
  data: { content: string | null; images: string[] | null } | null,
): ProductRichDescription | undefined {
  if (!data) return undefined;
  return {
    content: data.content,
    images: data.images ?? [],
  };
}

/**
 * Assemble the final ProductWithDetails shape from the base row + the
 * parallel detail fetches. Pure function — no Supabase access.
 */
export function assembleProductBySlug(
  product: ProductRow,
  details: RawDetails,
): ProductWithDetails {
  const allImages = details.imagesResult.data ?? [];
  const productImages = allImages.filter((img) => img.variant_id === null).map((img) => img.url);

  const variants = attachVariantImages(details.variantsResult.data ?? [], allImages);

  const categoryPath = resolveCategoryPath(details);
  const option_groups = product.metadata?.option_groups;

  return {
    ...(product as unknown as ProductWithDetails),
    images: productImages,
    product_details: details.detailsResult.data ?? [],
    variants: variants.length > 0 ? variants : undefined,
    rich_description: resolveRichDescription(details.richDescResult.data),
    brand: details.brandResult.data ?? undefined,
    categoryPath: categoryPath.length > 0 ? categoryPath : undefined,
    option_groups: option_groups && option_groups.length > 0 ? option_groups : undefined,
  };
}
