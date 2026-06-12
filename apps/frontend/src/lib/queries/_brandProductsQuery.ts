import type { SupabaseClient } from "@supabase/supabase-js";

export interface BrandProductFilters {
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

// Returns a Supabase query builder for the products table filtered by brand.
// Using `any` for the supabase typing because the `Database` schema is not
// imported in this module, and the consumer already uses an untyped client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

export function applyBrandPriceFilter(query: Query, filters: BrandProductFilters): Query {
  let q = query;
  if (filters.minPrice) {
    q = q.or(
      `and(discount_price.gt.0,discount_price.gte.${filters.minPrice}),and(discount_price.is.null,price.gte.${filters.minPrice}),and(discount_price.eq.0,price.gte.${filters.minPrice})`,
    );
  }
  if (filters.maxPrice) {
    q = q.or(
      `and(discount_price.gt.0,discount_price.lte.${filters.maxPrice}),and(discount_price.is.null,price.lte.${filters.maxPrice}),and(discount_price.eq.0,price.lte.${filters.maxPrice})`,
    );
  }
  return q;
}

export function applyBrandStockFilter(query: Query, filters: BrandProductFilters): Query {
  if (filters.inStock) {
    return query.gt("stock_quantity", 0);
  }
  return query;
}

export function applyBrandSort(query: Query, sort: string | undefined): Query {
  switch (sort) {
    case "price_asc":
      return query.order("price", { ascending: true });
    case "price_desc":
      return query.order("price", { ascending: false });
    case "popular":
      return query.order("stock_quantity", { ascending: true });
    case "newest":
    default:
      return query.order("created_at", { ascending: false });
  }
}

export function applyBrandPagination(query: Query, limit: number, offset: number): Query {
  return query.range(offset, offset + limit - 1);
}

export async function fetchBrandIdBySlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  brandSlug: string,
): Promise<string | null> {
  const { data: brand } = await supabase.from("brands").select("id").eq("slug", brandSlug).single();
  return brand?.id ?? null;
}
