import { createClient } from "@/lib/supabase/client";
import { log } from "@/lib/utils/logger";

import type { ProductFilters } from "@/types/product";

type SupabaseClient = ReturnType<typeof createClient>;

export interface CoreProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
  category_id: string | null;
}

/**
 * Deterministic daily shuffle — same order within a day (pagination-safe),
 * different each day. Used as the default "recommended" sort.
 */
function dailyShuffle<T extends { id: string }>(items: T[]): T[] {
  const seed = new Date().toISOString().slice(0, 10);
  return [...items].sort((a, b) => {
    const strA = a.id + seed;
    const strB = b.id + seed;
    let hashA = 0;
    let hashB = 0;
    for (let i = 0; i < strA.length; i++) hashA = ((hashA << 5) - hashA + strA.charCodeAt(i)) | 0;
    for (let i = 0; i < strB.length; i++) hashB = ((hashB << 5) - hashB + strB.charCodeAt(i)) | 0;
    return hashA - hashB;
  });
}

/**
 * Category-scoped fetch goes through the RPC. We previously resolved the
 * descendant tree client-side and passed ~700 product IDs back through
 * `.in("id", [...])`, but the 27KB URL silently 414'd at the CDN on large
 * categories (see /products?category=make-up-566e). The RPC does the
 * filter + sort + pagination server-side.
 */
export async function fetchByCategoryTree(
  supabase: SupabaseClient,
  filters: ProductFilters,
  limit: number,
  offset: number,
): Promise<{ data: CoreProductRow[]; total: number }> {
  const { data: rows, error } = await supabase.rpc("get_products_by_category_tree", {
    p_slug: filters.category!,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_in_stock: filters.inStock ?? null,
    p_sort: filters.sort ?? "newest",
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    log.error("products_by_category_tree_rpc_error", error);
    return { data: [], total: 0 };
  }

  const typed = (rows ?? []) as unknown as Array<CoreProductRow & { total_count: number | string }>;
  const data = typed.map(({ total_count: _tc, ...p }) => p);
  const total = typed.length > 0 ? Number(typed[0].total_count ?? 0) : 0;
  return { data, total };
}

const SORT_ORDER_MAP: Record<string, { column: string; ascending: boolean }> = {
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  popular: { column: "stock_quantity", ascending: true },
  newest: { column: "created_at", ascending: false },
};

/**
 * Direct `products` select path (no category filter). Returns a page of
 * core product rows plus the total count. When no sort is specified, falls
 * back to a daily-shuffled pool so the listing feels fresh.
 */
export async function fetchByDirectQuery(
  supabase: SupabaseClient,
  filters: ProductFilters,
  limit: number,
  offset: number,
): Promise<{ data: CoreProductRow[]; total: number }> {
  let query = supabase
    .from("products")
    .select("id, name, slug, price, discount_price, is_featured, stock_quantity, category_id", {
      count: "exact",
    })
    .eq("is_active", true);

  if (filters.minPrice) {
    query = query.or(
      `and(discount_price.gt.0,discount_price.gte.${filters.minPrice}),and(discount_price.is.null,price.gte.${filters.minPrice}),and(discount_price.eq.0,price.gte.${filters.minPrice})`,
    );
  }
  if (filters.maxPrice) {
    query = query.or(
      `and(discount_price.gt.0,discount_price.lte.${filters.maxPrice}),and(discount_price.is.null,price.lte.${filters.maxPrice}),and(discount_price.eq.0,price.lte.${filters.maxPrice})`,
    );
  }
  if (filters.inStock) {
    query = query.gt("stock_quantity", 0);
  }

  if (filters.sort && SORT_ORDER_MAP[filters.sort]) {
    const { column, ascending } = SORT_ORDER_MAP[filters.sort];
    query = query.order(column, { ascending });
  }

  if (!filters.sort) {
    const { data: pool, error } = await query.limit(500);
    if (error) throw error;
    const shuffled = dailyShuffle(pool ?? []);
    return {
      data: shuffled.slice(offset, offset + limit) as CoreProductRow[],
      total: shuffled.length,
    };
  }

  query = query.range(offset, offset + limit - 1);
  const result = await query;
  if (result.error) throw result.error;
  return {
    data: (result.data ?? []) as CoreProductRow[],
    total: result.count ?? 0,
  };
}
