import { createClient } from "@/lib/supabase/client";
import { log } from "@/lib/utils/logger";

import {
  applyBrandPagination,
  applyBrandPriceFilter,
  applyBrandSort,
  applyBrandStockFilter,
  fetchBrandIdBySlug,
} from "./_brandProductsQuery";

import type { ProductListItem } from "@/types/product";

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages(products: ProductListItem[]): Promise<ProductListItem[]> {
  if (products.length === 0) return products;

  const supabase = createClient();
  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  // Fetch in parallel batches (URL length safe + low latency).
  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    batches.push(productIds.slice(i, i + BATCH_SIZE));
  }
  const batchResults = await Promise.all(
    batches.map((batchIds) =>
      supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .in("product_id", batchIds)
        .is("variant_id", null)
        .order("sort_order", { ascending: true }),
    ),
  );
  for (const { data: images } of batchResults) {
    for (const img of images ?? []) {
      const existing = imageMap.get(img.product_id) || [];
      existing.push(img.url);
      imageMap.set(img.product_id, existing);
    }
  }

  if (imageMap.size === 0) return products;

  // Merge images into products
  return products.map((p) => {
    const productImages = imageMap.get(p.id);
    return productImages && productImages.length > 0 ? { ...p, images: productImages } : p;
  });
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  // `banner_image` and `type` were in the client type but never in the
  // production `brands` schema, so the /brands listing 400'd with
  // "column brands.banner_image does not exist". Kept as optional
  // for forward-compat if the admin ever adds the columns.
  banner_image?: string | null;
  type?: string | null;
}

export interface BrandProductsResult {
  data: ProductListItem[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export const brandKeys = {
  all: ["brands"] as const,
  lists: () => [...brandKeys.all, "list"] as const,
  detail: (slug: string) => [...brandKeys.all, "detail", slug] as const,
  products: (slug: string, filters?: Record<string, unknown>) =>
    [...brandKeys.all, "products", slug, filters ?? {}] as const,
};

// Explicit column list matches the production schema. `banner_image`
// and `type` were requested here but have never existed on the live
// `brands` table — the client type keeps them as optional in case
// they're added later.
const BRAND_COLUMNS = "id, name, slug, logo_url";

export async function getBrands(): Promise<Brand[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    log.error("brands_fetch_failed", error);
    return [];
  }

  return (data ?? []) as Brand[];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_COLUMNS)
    .eq("slug", slug)
    .single();

  if (error) {
    log.error("brand_fetch_failed", error);
    return null;
  }

  return data as Brand;
}

export async function getProductsByBrand(
  brandSlug: string,
  filters: {
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<BrandProductsResult> {
  const supabase = createClient();

  const brandId = await fetchBrandIdBySlug(supabase, brandSlug);
  if (!brandId) {
    return { data: [], total: 0, hasMore: false, nextOffset: null };
  }

  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("products")
    .select("id, name, slug, price, discount_price, is_featured, stock_quantity", {
      count: "exact",
    })
    .eq("is_active", true)
    .eq("brand_id", brandId);

  query = applyBrandPriceFilter(query, filters);
  query = applyBrandStockFilter(query, filters);
  query = applyBrandSort(query, filters.sort);
  query = applyBrandPagination(query, limit, offset);

  const { data, count, error } = await query;

  if (error) {
    log.error("brand_products_fetch_failed", error);
    return { data: [], total: 0, hasMore: false, nextOffset: null };
  }

  const total = count ?? 0;

  if (!data || data.length === 0) {
    return { data: [], total, hasMore: false, nextOffset: null };
  }

  const products: ProductListItem[] = data.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    discount_price: p.discount_price,
    images: [],
    is_featured: p.is_featured,
    stock_quantity: p.stock_quantity,
  }));

  // Attach images from product_images table
  const productsWithImages = await attachProductImages(products);

  const nextOffset = offset + limit;
  const hasMore = nextOffset < total;

  return {
    data: productsWithImages,
    total,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}
