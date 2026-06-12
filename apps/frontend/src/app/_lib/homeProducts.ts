import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";

import type { Product } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fetch product images from product_images table and merge with products (with batching)
export async function attachProductImages(
  supabase: SupabaseClient,
  products: Product[],
): Promise<Product[]> {
  if (products.length === 0) return products;

  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  // Fetch in batches in parallel to avoid URL length limit AND serial latency.
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

// Fetch products for featured categories with random-offset sampling so
// every product in the category (not just the newest N) has a chance to
// surface on the home screen.
//
// Performance contract:
// - Counts are cached in Redis for 5 min (rarely change, HEAD-only req).
// - The 10-row fetch runs per render but is throttled by Next.js ISR
//   (`revalidate = 60`), so DB hit rate stays at ~1/min/category.
// - Every regeneration picks a fresh random offset, so the visible slice
//   rotates over time and covers the full catalog.
export async function fetchCategoryProducts(
  supabase: SupabaseClient,
  categoryIds: string[],
  limit: number = 10,
): Promise<Map<string, Product[]>> {
  const productsByCategory = new Map<string, Product[]>();
  if (categoryIds.length === 0) return productsByCategory;

  // 1. Cache count per category (5 min — counts move slowly).
  const counts = await Promise.all(
    categoryIds.map((categoryId) =>
      getCachedOrFetch<number>(
        `${cacheKeys.categoryProducts(categoryId)}:count`,
        async () => {
          const { count } = await supabase
            .from("products")
            .select("*, product_categories!inner(category_id)", {
              count: "exact",
              head: true,
            })
            .eq("product_categories.category_id", categoryId)
            .eq("is_active", true);
          return count ?? 0;
        },
        300,
      ),
    ),
  );

  // 2. Per category, pick a random offset and fetch `limit` rows.
  const fetches = await Promise.all(
    categoryIds.map(async (categoryId, i) => {
      const total = counts[i];
      if (total === 0) return [] as Product[];

      const maxOffset = Math.max(0, total - limit);
      const offset = Math.floor(Math.random() * (maxOffset + 1));

      const { data } = await supabase
        .from("products")
        .select("*, product_categories!inner(category_id)")
        .eq("product_categories.category_id", categoryId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const products = ((data as Product[] | null) ?? []).slice();
      // Shuffle the 10 so display order is also random.
      for (let j = products.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [products[j], products[k]] = [products[k], products[j]];
      }
      return products;
    }),
  );

  for (let i = 0; i < categoryIds.length; i++) {
    if (fetches[i].length > 0) {
      productsByCategory.set(categoryIds[i], fetches[i]);
    }
  }

  return productsByCategory;
}
