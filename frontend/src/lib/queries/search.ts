import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages<T extends { id: string; images: string[] }>(
  items: T[],
): Promise<T[]> {
  if (items.length === 0) return items;

  const supabase = createClient();
  const productIds = items.map((p) => p.id);
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

  // Fetch default variant images for products without product-level images
  const productsWithoutImages = productIds.filter((id) => !imageMap.has(id));
  if (productsWithoutImages.length > 0) {
    // Get default (or first) variant for each product
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, product_id, is_default")
      .in("product_id", productsWithoutImages)
      .eq("status", "active")
      .order("is_default", { ascending: false });

    const defaultVariantMap = new Map<string, string>();
    for (const v of variants ?? []) {
      if (!defaultVariantMap.has(v.product_id)) {
        defaultVariantMap.set(v.product_id, v.id);
      }
    }

    const variantIds = [...defaultVariantMap.values()];
    if (variantIds.length > 0) {
      const { data: variantImages } = await supabase
        .from("product_images")
        .select("variant_id, product_id, url, sort_order")
        .in("variant_id", variantIds)
        .order("sort_order", { ascending: true });

      for (const img of variantImages ?? []) {
        const existing = imageMap.get(img.product_id) || [];
        existing.push(img.url);
        imageMap.set(img.product_id, existing);
      }
    }
  }

  if (imageMap.size === 0) return items;

  // Merge images into items
  return items.map((p) => {
    const productImages = imageMap.get(p.id);
    return productImages && productImages.length > 0
      ? { ...p, images: productImages }
      : p;
  });
}

// --- Types ---

export interface SearchSuggestion {
  type: "product" | "category" | "brand";
  text: string;
  slug: string;
  image: string | null;
  similarity: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  images: string[];
  is_featured: boolean;
  stock_quantity: number;
  category_name: string | null;
  category_slug: string | null;
  similarity: number;
}

export interface SearchResult {
  data: ProductListItem[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
  fuzzyFallback: boolean;
}

export interface ProductFilters {
  search: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface TrendingSearch {
  query: string;
  search_count: number;
  weighted_score: number;
  last_searched_at: string;
}

// --- Query Keys ---

export const searchKeys = {
  all: ["search"] as const,
  suggestions: (query: string) => ["search", "suggestions", query] as const,
  results: (filters: Omit<ProductFilters, "limit" | "offset">) =>
    ["search", "results", filters] as const,
  trending: () => ["search", "trending"] as const,
};

// --- Fetch Functions ---

export async function getSearchSuggestions(
  query: string,
): Promise<SearchSuggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_suggestions", {
    p_search_query: query,
    p_max_results: 8,
  });
  if (error) throw error;
  return (data ?? []) as SearchSuggestion[];
}

export async function searchProducts(
  filters: ProductFilters,
): Promise<SearchResult> {
  const supabase = createClient();
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;
  // Convert offset to page number for RPC (page is 1-indexed)
  const page = Math.floor(offset / limit) + 1;

  const { data, error } = await supabase.rpc("search_products", {
    p_search_query: filters.search,
    p_category_slug: filters.category ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_in_stock: filters.inStock ?? null,
    p_sort_by: filters.sort ?? "relevance",
    p_page_number: page,
    p_page_size: limit,
  });

  if (error) throw error;

  const rows = (data ?? []) as (ProductListItem & {
    total_count: number;
    fuzzy_fallback?: boolean;
  })[];
  const total = rows[0]?.total_count ?? 0;
  const fuzzyFallback = rows[0]?.fuzzy_fallback ?? false;

  // Parse numeric values (PostgreSQL numeric can come as string from RPC)
  // Explicit pick to strip `total_count` and `fuzzy_fallback` from rows.
  const products: ProductListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    discount_price: row.discount_price != null ? Number(row.discount_price) : null,
    images: row.images,
    is_featured: row.is_featured,
    stock_quantity: row.stock_quantity,
    category_name: row.category_name,
    category_slug: row.category_slug,
    similarity: row.similarity,
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
    fuzzyFallback,
  };
}

export async function logSearch(
  query: string,
  resultCount: number,
): Promise<void> {
  const supabase = createClient();
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery.length < 2) return;

  let sessionId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("monpang:session-id")
      : null;

  if (!sessionId && typeof window !== "undefined") {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("monpang:session-id", sessionId);
  }

  await supabase.from("search_logs").insert({
    query: normalizedQuery,
    raw_query: query.trim(),
    session_id: sessionId,
    result_count: resultCount,
  });
}

export async function getTrendingSearches(
  limit = 5,
): Promise<TrendingSearch[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_trending_searches", {
    p_limit: limit,
    p_days: 7,
    p_min_count: 1,
  });

  if (error) {
    console.error("Failed to fetch trending searches:", error.message, error.code, error.details);
    return [];
  }

  return (data ?? []) as TrendingSearch[];
}
