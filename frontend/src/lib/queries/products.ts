import { createClient } from "@/lib/supabase/client";
import { CACHE_TTL } from "@/lib/utils/constants";
import type { ProductFilters, ProductListItem } from "@/types/product";
import type { Product, Category } from "@/types/database";

// Deterministic daily shuffle — same order within a day (pagination-safe), different each day
function dailyShuffle<T extends { id: string }>(items: T[]): T[] {
  const seed = new Date().toISOString().slice(0, 10);
  return [...items].sort((a, b) => {
    const strA = a.id + seed;
    const strB = b.id + seed;
    let hashA = 0, hashB = 0;
    for (let i = 0; i < strA.length; i++) hashA = ((hashA << 5) - hashA) + strA.charCodeAt(i) | 0;
    for (let i = 0; i < strB.length; i++) hashB = ((hashB << 5) - hashB) + strB.charCodeAt(i) | 0;
    return hashA - hashB;
  });
}

// Query key factory
export const productKeys = {
  all: ["products"] as const,
  lists: (filters?: ProductFilters) =>
    [...productKeys.all, "list", filters ?? {}] as const,
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

// Row shape shared by the direct `products` select and the
// `get_products_by_category_tree` RPC. The two paths converge into
// the same downstream enrichment pipeline below.
interface CoreProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
  category_id: string | null;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductsResult> {
  const supabase = createClient();
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  let data: CoreProductRow[];
  let total: number;

  if (filters.category) {
    // Category queries go through the RPC. Previously we resolved
    // the descendant tree + collected ~700 product IDs client-side
    // and passed them back through `.in("id", [...])`, but the 27KB
    // URL silently 414'd at the CDN on large categories (see
    // /products?category=make-up-566e). The RPC does the whole
    // filter + sort + pagination server-side.
    // The generated Supabase RPC union doesn't include our new
    // function yet — the `as any` narrows only the function-name
    // argument, the result is still typed below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabase.rpc as any)(
      "get_products_by_category_tree",
      {
        p_slug: filters.category,
        p_min_price: filters.minPrice ?? null,
        p_max_price: filters.maxPrice ?? null,
        p_in_stock: filters.inStock ?? null,
        p_sort: filters.sort ?? "newest",
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (error) {
      console.error("get_products_by_category_tree error:", error);
      return { data: [], total: 0, hasMore: false, nextOffset: null };
    }

    const typed = (rows ?? []) as unknown as Array<
      CoreProductRow & { total_count: number | string }
    >;
    data = typed.map(({ total_count: _tc, ...p }) => p);
    total =
      typed.length > 0 ? Number(typed[0].total_count ?? 0) : 0;
  } else {
    let query = supabase
      .from("products")
      .select(
        "id, name, slug, price, discount_price, is_featured, stock_quantity, category_id",
        { count: "exact" },
      )
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
        query = query.order("created_at", { ascending: false });
        break;
      // default: no order — will shuffle client-side
    }

    if (!filters.sort) {
      // Random/recommended: fetch pool, shuffle with daily seed, paginate client-side
      const { data: pool, error } = await query.limit(500);
      if (error) throw error;
      const shuffled = dailyShuffle(pool ?? []);
      total = shuffled.length;
      data = shuffled.slice(offset, offset + limit) as CoreProductRow[];
    } else {
      query = query.range(offset, offset + limit - 1);
      const result = await query;
      if (result.error) throw result.error;
      data = (result.data ?? []) as CoreProductRow[];
      total = result.count ?? 0;
    }
  }

  const productIds = data.map((p) => p.id);
  if (productIds.length === 0) {
    return { data: [], total, hasMore: false, nextOffset: null };
  }

  // Fetch categories and images in parallel
  const BATCH_SIZE = 50;
  const productImagesMap = new Map<string, string[]>();
  const productCategoryMap = new Map<string, { name: string; slug: string }>();

  // Get unique category IDs from products and fetch category info.
  // is_active filter excludes admin-disabled categories so cards don't
  // surface a category label that is hidden from navigation.
  const categoryIds = [...new Set((data ?? []).map((p) => p.category_id).filter((id): id is string => id !== null))];
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .in("id", categoryIds);

    const categoryMap = new Map((categories ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }]));
    for (const p of data ?? []) {
      if (p.category_id && categoryMap.has(p.category_id)) {
        productCategoryMap.set(p.id, categoryMap.get(p.category_id)!);
      }
    }
  }

  // Fetch product_images in parallel batches (URL length safe + low latency).
  const imageBatches: string[][] = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    imageBatches.push(productIds.slice(i, i + BATCH_SIZE));
  }
  const imageBatchResults = await Promise.all(
    imageBatches.map((batchIds) =>
      supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .in("product_id", batchIds)
        .is("variant_id", null)
        .order("sort_order", { ascending: true }),
    ),
  );
  for (const { data: batchImages } of imageBatchResults) {
    for (const img of batchImages ?? []) {
      const existing = productImagesMap.get(img.product_id) || [];
      existing.push(img.url);
      productImagesMap.set(img.product_id, existing);
    }
  }

  // Fetch default variants for all products (is_default first, then fall back to first active variant)
  const defaultVariantMap = new Map<string, { id: string; price: number; discount_price: number | null }>();
  const { data: allVariants } = await supabase
    .from("product_variants")
    .select("id, product_id, price, discount_price, is_default")
    .in("product_id", productIds)
    .eq("status", "active")
    .order("is_default", { ascending: false });

  for (const v of allVariants ?? []) {
    // Only set if not already mapped (first = is_default:true, then others)
    if (!defaultVariantMap.has(v.product_id)) {
      defaultVariantMap.set(v.product_id, { id: v.id, price: v.price, discount_price: v.discount_price });
    }
  }

  // Fetch variant images for products that have no product-level images
  const productsWithoutImages = productIds.filter((id) => !productImagesMap.has(id) || productImagesMap.get(id)!.length === 0);
  if (productsWithoutImages.length > 0) {
    const variantIds = productsWithoutImages
      .map((pid) => defaultVariantMap.get(pid)?.id)
      .filter((id): id is string => !!id);

    if (variantIds.length > 0) {
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
  }

  const products: ProductListItem[] = (data ?? []).map((p) => {
    const defaultVariant = defaultVariantMap.get(p.id);
    // If product has a default variant, use variant's price instead of product.price
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
  brand?: ProductBrand;
  categoryPath?: ProductCategory[];
  option_groups?: OptionGroup[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = createClient();

  // Check if input is UUID (product_id) or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  // Fetch the product
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq(isUUID ? "id" : "slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) return null;

  // Fetch product details, variants, images, rich descriptions, brand, and categories in parallel
  const [detailsResult, variantsResult, imagesResult, richDescResult, brandResult, allCategoriesResult, productCategoriesResult] = await Promise.all([
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
          .from("brands" as any)
          .select("id, name, slug, logo_url")
          .eq("id", product.brand_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true),
    supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", product.id),
  ]);

  // Build category path (from root to the deepest category)
  let categoryPath: ProductCategory[] = [];
  const productCatIds = productCategoriesResult.data ?? [];

  if (allCategoriesResult.data && productCatIds.length > 0) {
    const allCategories = allCategoriesResult.data as ProductCategory[];
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
    const productCategoryIds = productCatIds.map((pc) => pc.category_id);

    // Find the deepest category (one with most ancestors)
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

    // Build path from root to deepest category
    if (deepestCat) {
      let currentCat: ProductCategory | undefined = deepestCat;
      while (currentCat) {
        categoryPath.unshift(currentCat);
        currentCat = currentCat.parent_id ? categoryMap.get(currentCat.parent_id) : undefined;
      }
    }
  }

  // Extract product-level images (variant_id is null)
  const productImages = (imagesResult.data || [])
    .filter((img) => img.variant_id === null)
    .map((img) => img.url);

  // Map images to variants
  const variantsData = (variantsResult.data || []) as unknown as Array<{
    id: string;
    name: string | null;
    sku: string | null;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    is_default: boolean;
    option_values: string[] | null;
  }>;
  const variants: ProductVariant[] = variantsData.map((v) => ({
    ...v,
    images: (imagesResult.data || [])
      .filter((img) => img.variant_id === v.id)
      .map((img) => img.url),
  }));

  // Extract option_groups from metadata
  const metadata = product.metadata as { option_groups?: OptionGroup[] } | null;
  const option_groups = metadata?.option_groups;

  return {
    ...product,
    images: productImages,
    product_details: detailsResult.data || [],
    variants: variants.length > 0 ? variants : undefined,
    rich_description: richDescResult.data
      ? {
          content: richDescResult.data.content,
          images: richDescResult.data.images ?? [],
        }
      : undefined,
    brand: brandResult.data ? (brandResult.data as unknown as ProductBrand) : undefined,
    categoryPath: categoryPath.length > 0 ? categoryPath : undefined,
    option_groups: option_groups && option_groups.length > 0 ? option_groups : undefined,
  };
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

  // Build tree
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

// Stale times for queries
export const PRODUCT_STALE_TIMES = {
  list: CACHE_TTL.PRODUCTS_LIST * 1000,
  detail: CACHE_TTL.PRODUCT_DETAIL * 1000,
  categories: CACHE_TTL.CATEGORIES * 1000,
};

// Get related products by category or brand
export async function getRelatedProducts(
  productId: string,
  categoryId?: string,
  brandId?: string | null,
  limit = 8
): Promise<ProductListItem[]> {
  const supabase = createClient();

  let productIds: string[] = [];

  // First try to get products from the same category
  if (categoryId) {
    const { data: productCats } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId)
      .neq("product_id", productId)
      .limit(limit);

    productIds = (productCats ?? []).map((pc) => pc.product_id);
  }

  // If not enough products from category, add from same brand
  if (productIds.length < limit && brandId) {
    const { data: brandProducts } = await supabase
      .from("products")
      .select("id")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .neq("id", productId)
      .not("id", "in", `(${productIds.length > 0 ? productIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
      .limit(limit - productIds.length);

    productIds.push(...((brandProducts ?? []).map((p) => p.id)));
  }

  if (productIds.length === 0) {
    return [];
  }

  // Fetch full product data
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, discount_price, is_featured, stock_quantity")
    .in("id", productIds)
    .eq("is_active", true);

  if (!products || products.length === 0) {
    return [];
  }

  // Fetch images and default variants in parallel
  const productImagesMap = new Map<string, string[]>();
  const defaultVariantMap = new Map<string, { id: string; price: number; discount_price: number | null }>();

  const [imagesResult, variantsResult] = await Promise.all([
    supabase
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", productIds)
      .is("variant_id", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, product_id, price, discount_price, is_default")
      .in("product_id", productIds)
      .eq("status", "active")
      .order("is_default", { ascending: false }),
  ]);

  for (const img of imagesResult.data ?? []) {
    const existing = productImagesMap.get(img.product_id) || [];
    existing.push(img.url);
    productImagesMap.set(img.product_id, existing);
  }

  for (const v of variantsResult.data ?? []) {
    if (!defaultVariantMap.has(v.product_id)) {
      defaultVariantMap.set(v.product_id, { id: v.id, price: v.price, discount_price: v.discount_price });
    }
  }

  // Fetch variant images for products that have no product-level images
  const productsWithoutImages = productIds.filter((id) => !productImagesMap.has(id) || productImagesMap.get(id)!.length === 0);
  if (productsWithoutImages.length > 0) {
    const variantIds = productsWithoutImages
      .map((pid) => defaultVariantMap.get(pid)?.id)
      .filter((id): id is string => !!id);

    if (variantIds.length > 0) {
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
  }

  return products.map((p) => {
    const defaultVariant = defaultVariantMap.get(p.id);
    // If product has a default variant, use variant's price instead of product.price
    const displayPrice = defaultVariant?.price ?? p.price;
    const displayDiscountPrice = defaultVariant ? defaultVariant.discount_price : p.discount_price;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: displayPrice,
      discount_price: displayDiscountPrice,
      images: productImagesMap.get(p.id) ?? [],
      is_featured: p.is_featured,
      stock_quantity: p.stock_quantity,
      category: null,
    };
  });
}
