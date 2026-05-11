import { createClient } from "@/lib/supabase/client";
import type { ProductListItem } from "@/types/product";

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages(
  products: ProductListItem[],
): Promise<ProductListItem[]> {
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
    return productImages && productImages.length > 0
      ? { ...p, images: productImages }
      : p;
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
    console.error("Error fetching brands:", error);
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
    console.error("Error fetching brand:", error);
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

  // Get the brand id from slug
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", brandSlug)
    .single();

  if (!brand) {
    return { data: [], total: 0, hasMore: false, nextOffset: null };
  }

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, discount_price, is_featured, stock_quantity",
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("brand_id", brand.id);

  if (filters.minPrice) {
    query = query.or(
      `and(discount_price.gt.0,discount_price.gte.${filters.minPrice}),and(discount_price.is.null,price.gte.${filters.minPrice}),and(discount_price.eq.0,price.gte.${filters.minPrice})`
    );
  }
  if (filters.maxPrice) {
    query = query.or(
      `and(discount_price.gt.0,discount_price.lte.${filters.maxPrice}),and(discount_price.is.null,price.lte.${filters.maxPrice}),and(discount_price.eq.0,price.lte.${filters.maxPrice})`
    );
  }
  if (filters.inStock) {
    query = query.gt("stock_quantity", 0);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "popular":
      query = query.order("stock_quantity", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching brand products:", error);
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
