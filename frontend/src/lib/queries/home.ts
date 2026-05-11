import { createClient } from "@/lib/supabase/client";
import { HOME_QUERY_LIMITS } from "@/lib/utils/constants";
import { log } from "@/lib/utils/logger";
import type { Product } from "@/types/database";

export interface PaginatedProductsResult {
  data: Product[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export const homeKeys = {
  heroProducts: ["home", "hero"] as const,
  categories: ["home", "categories"] as const,
  saleProducts: ["home", "sale"] as const,
  newProducts: (period: string) => ["home", "new", period] as const,
  timedSaleProducts: ["home", "timedSale"] as const,
  discountedProducts: ["home", "discounted"] as const,
  bestSelling: (period: string) => ["home", "bestSelling", period] as const,
  featuredProducts: ["home", "featured"] as const,
  recommendedProducts: ["home", "recommended"] as const,
  trendingProducts: ["home", "trending"] as const,
  popularProducts: ["home", "popular"] as const,
  topRatedProducts: ["home", "topRated"] as const,
  brandProducts: (brand: string) => ["home", "brand", brand] as const,
};

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;

  const supabase = createClient();
  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  // Fetch in batches to avoid URL length limit
  const BATCH_SIZE = 50;
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const batchIds = productIds.slice(i, i + BATCH_SIZE);
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", batchIds)
      .is("variant_id", null)
      .order("sort_order", { ascending: true });

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
    return productImages && productImages.length > 0
      ? { ...p, images: productImages }
      : p;
  });
}

export async function getBestSellingProducts(
  period = "7d",
  options: { limit?: number; offset?: number } = {},
): Promise<PaginatedProductsResult> {
  const supabase = createClient();
  const limit = options.limit ?? 12;
  const offset = options.offset ?? 0;

  // Map period string to days
  const periodDays: Record<string, number> = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
    "365d": 365,
  };
  const days = periodDays[period] || 7;

  // Call the RPC function (uses SECURITY DEFINER to bypass RLS)
  const { data, error } = await supabase.rpc("get_best_selling_products", {
    p_period_days: days,
    p_limit: 500, // Get more to calculate total for pagination
  });

  if (!error && data && data.length > 0) {
    // Map RPC result to Product type (remove total_sold field), filter inactive products
    const allProducts: Product[] = data
      .filter((item: { is_active: boolean }) => item.is_active === true)
      .map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ total_sold, ...product }: { total_sold: number } & Product) =>
          product as Product,
      );
    const total = allProducts.length;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    const nextOffset = offset + limit;
    const hasMore = nextOffset < total;

    return {
      data: paginatedProducts,
      total,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
    };
  }

  // Log the error for debugging
  if (error) {
    log.error("best_sellers_rpc_error", error);
  }

  // Fallback to newest products if no sales data
  const { data: fallback, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const total = count ?? 0;
  const productsWithImages = await attachProductImages(fallback ?? []);
  const nextOffset = offset + limit;
  const hasMore = nextOffset < total;

  return {
    data: productsWithImages,
    total,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}

export async function getNewProducts(
  period = "7d",
  options: { limit?: number; offset?: number } = {},
): Promise<PaginatedProductsResult> {
  const supabase = createClient();
  const limit = options.limit ?? 12;
  const offset = options.offset ?? 0;

  // Calculate date based on period
  const now = new Date();
  const periodDays: Record<string, number> = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
    "365d": 365,
  };
  const days = periodDays[period] || 7;
  const startDate = new Date(
    now.getTime() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .gte("created_at", startDate)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const total = count ?? 0;
  const productsWithImages = await attachProductImages(data ?? []);

  const nextOffset = offset + limit;
  const hasMore = nextOffset < total;

  return {
    data: productsWithImages,
    total,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}

export async function getBrandProducts(
  brand: string,
  limit = HOME_QUERY_LIMITS.BRAND,
) {
  const supabase = createClient();
  const query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (brand !== "Бүгд") {
    query.eq("category_id", brand);
  }

  const { data } = await query;
  return attachProductImages(data ?? []);
}
