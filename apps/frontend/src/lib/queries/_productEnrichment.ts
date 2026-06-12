import { createClient } from "@/lib/supabase/client";

import type { ProductListItem } from "@/types/product";

type SupabaseClient = ReturnType<typeof createClient>;

interface BaseProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
  category_id?: string | null;
}

interface DefaultVariant {
  id: string;
  price: number;
  discount_price: number | null;
}

interface CategoryInfo {
  name: string;
  slug: string;
}

const BATCH_SIZE = 50;

/**
 * Fetch product-level images (variant_id IS NULL) in batches to avoid
 * Supabase URL length limits on `.in()` queries with hundreds of ids.
 */
async function fetchProductImages(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, string[]>> {
  const productImagesMap = new Map<string, string[]>();
  const batches: string[][] = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    batches.push(productIds.slice(i, i + BATCH_SIZE));
  }
  const results = await Promise.all(
    batches.map((batchIds) =>
      supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .in("product_id", batchIds)
        .is("variant_id", null)
        .order("sort_order", { ascending: true }),
    ),
  );
  for (const { data: batchImages } of results) {
    for (const img of batchImages ?? []) {
      const existing = productImagesMap.get(img.product_id) || [];
      existing.push(img.url);
      productImagesMap.set(img.product_id, existing);
    }
  }
  return productImagesMap;
}

async function fetchDefaultVariants(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, DefaultVariant>> {
  const defaultVariantMap = new Map<string, DefaultVariant>();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, product_id, price, discount_price, is_default")
    .in("product_id", productIds)
    .eq("status", "active")
    .order("is_default", { ascending: false });

  for (const v of variants ?? []) {
    if (!defaultVariantMap.has(v.product_id)) {
      defaultVariantMap.set(v.product_id, {
        id: v.id,
        price: v.price,
        discount_price: v.discount_price,
      });
    }
  }
  return defaultVariantMap;
}

/**
 * Backfill: for products with no product-level images, fall back to the
 * default variant's images so the card still renders something useful.
 */
async function backfillVariantImages(
  supabase: SupabaseClient,
  productIds: string[],
  productImagesMap: Map<string, string[]>,
  defaultVariantMap: Map<string, DefaultVariant>,
): Promise<void> {
  const productsWithoutImages = productIds.filter(
    (id) => !productImagesMap.has(id) || productImagesMap.get(id)!.length === 0,
  );
  if (productsWithoutImages.length === 0) return;

  const variantIds = productsWithoutImages
    .map((pid) => defaultVariantMap.get(pid)?.id)
    .filter((id): id is string => !!id);
  if (variantIds.length === 0) return;

  const { data: variantImages } = await supabase
    .from("product_images")
    .select("variant_id, product_id, url, sort_order")
    .in("variant_id", variantIds)
    .order("sort_order", { ascending: true });

  for (const img of variantImages ?? []) {
    const existing = productImagesMap.get(img.product_id) || [];
    existing.push(img.url);
    productImagesMap.set(img.product_id, existing);
  }
}

async function fetchProductCategories(
  supabase: SupabaseClient,
  products: BaseProductRow[],
): Promise<Map<string, CategoryInfo>> {
  const productCategoryMap = new Map<string, CategoryInfo>();
  const categoryIds = [
    ...new Set(products.map((p) => p.category_id).filter((id): id is string => id != null)),
  ];
  if (categoryIds.length === 0) return productCategoryMap;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .in("id", categoryIds);

  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }]),
  );
  for (const p of products) {
    if (p.category_id && categoryMap.has(p.category_id)) {
      productCategoryMap.set(p.id, categoryMap.get(p.category_id)!);
    }
  }
  return productCategoryMap;
}

interface EnrichOptions {
  includeCategoryLabel?: boolean;
}

/**
 * Enrich a list of base product rows with images (with variant fallback),
 * default variant pricing, and (optionally) category labels. Used by both
 * getProducts (with category) and getRelatedProducts (without).
 */
export async function enrichProductsWithMedia(
  supabase: SupabaseClient,
  baseProducts: BaseProductRow[],
  options: EnrichOptions = {},
): Promise<ProductListItem[]> {
  if (baseProducts.length === 0) return [];

  const productIds = baseProducts.map((p) => p.id);
  const [productImagesMap, defaultVariantMap, productCategoryMap] = await Promise.all([
    fetchProductImages(supabase, productIds),
    fetchDefaultVariants(supabase, productIds),
    options.includeCategoryLabel
      ? fetchProductCategories(supabase, baseProducts)
      : Promise.resolve(new Map<string, CategoryInfo>()),
  ]);

  await backfillVariantImages(supabase, productIds, productImagesMap, defaultVariantMap);

  return baseProducts.map((p) => {
    const defaultVariant = defaultVariantMap.get(p.id);
    const displayPrice = defaultVariant?.price ?? p.price;
    const displayDiscountPrice = defaultVariant ? defaultVariant.discount_price : p.discount_price;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: displayPrice,
      discount_price: displayDiscountPrice,
      images: productImagesMap.get(p.id) ?? [],
      is_featured: p.is_featured ?? false,
      stock_quantity: p.stock_quantity ?? 0,
      category: productCategoryMap.get(p.id),
    };
  });
}
