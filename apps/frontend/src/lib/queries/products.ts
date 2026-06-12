import { createClient } from "@/lib/supabase/client";
import { CACHE_TTL } from "@/lib/utils/constants";

import {
  assembleProductBySlug,
  fetchProductBySlugBase,
  fetchProductBySlugDetails,
} from "./_productBySlugQueries";
import { enrichProductsWithMedia } from "./_productEnrichment";
import { fetchByCategoryTree, fetchByDirectQuery } from "./_productListQueries";

import type { Product, Category } from "@/types/database";
import type { ProductFilters, ProductListItem } from "@/types/product";

// Query key factory
export const productKeys = {
  all: ["products"] as const,
  lists: (filters?: ProductFilters) => [...productKeys.all, "list", filters ?? {}] as const,
  detail: (slug: string) => [...productKeys.all, "detail", slug] as const,
  related: (productId: string) => [...productKeys.all, "related", productId] as const,
  categories: ["categories"] as const,
};

export interface ProductsResult {
  data: ProductListItem[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
  const supabase = createClient();
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  const { data, total } = filters.category
    ? await fetchByCategoryTree(supabase, filters, limit, offset)
    : await fetchByDirectQuery(supabase, filters, limit, offset);

  if (data.length === 0) {
    return { data: [], total, hasMore: false, nextOffset: null };
  }

  const products = await enrichProductsWithMedia(supabase, data, {
    includeCategoryLabel: true,
  });

  const nextOffset = offset + limit;
  const hasMore = nextOffset < total;
  return {
    data: products,
    total,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}

export interface ProductDetail {
  id: string;
  type: string;
  content: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  name: string | null;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default: boolean;
  images: string[];
  option_values: string[] | null;
}

export interface OptionGroup {
  type: string;
  values: string[];
  is_required?: boolean;
}

export interface ProductRichDescription {
  content: string | null;
  images: string[];
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface ProductWithDetails extends Product {
  product_details?: ProductDetail[];
  variants?: ProductVariant[];
  rich_description?: ProductRichDescription;
  brand?: ProductBrand | null;
  category?: { name: string; slug: string } | null;
  reviewCount?: number;
  averageRating?: number;
  categoryPath?: ProductCategory[];
  option_groups?: OptionGroup[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = createClient();
  const product = await fetchProductBySlugBase(supabase, slug);
  if (!product) return null;

  const details = await fetchProductBySlugDetails(supabase, product);
  return assembleProductBySlug(product, details);
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export async function getCategories(): Promise<CategoryWithChildren[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const categories = data ?? [];
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id) {
      const parentNode = map.get(cat.parent_id);
      if (parentNode) {
        parentNode.children.push(node);
      }
      // Drop orphans whose parent is inactive — otherwise they'd surface
      // as fake top-level entries when an admin deactivates a parent.
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const PRODUCT_STALE_TIMES = {
  list: CACHE_TTL.PRODUCTS_LIST * 1000,
  detail: CACHE_TTL.PRODUCT_DETAIL * 1000,
  categories: CACHE_TTL.CATEGORIES * 1000,
};

export async function getRelatedProducts(
  productId: string,
  categoryId?: string,
  brandId?: string | null,
  limit = 8,
): Promise<ProductListItem[]> {
  const supabase = createClient();

  let productIds: string[] = [];

  if (categoryId) {
    const { data: productCats } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId)
      .neq("product_id", productId)
      .limit(limit);
    productIds = (productCats ?? []).map((pc) => pc.product_id);
  }

  if (productIds.length < limit && brandId) {
    const { data: brandProducts } = await supabase
      .from("products")
      .select("id")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .neq("id", productId)
      .not(
        "id",
        "in",
        `(${productIds.length > 0 ? productIds.join(",") : "00000000-0000-0000-0000-000000000000"})`,
      )
      .limit(limit - productIds.length);
    productIds.push(...(brandProducts ?? []).map((p) => p.id));
  }

  if (productIds.length === 0) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, discount_price, is_featured, stock_quantity")
    .in("id", productIds)
    .eq("is_active", true);

  if (!products || products.length === 0) return [];

  return enrichProductsWithMedia(supabase, products);
}
