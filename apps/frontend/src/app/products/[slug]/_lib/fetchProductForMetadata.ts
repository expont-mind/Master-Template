// Server-side product fetch tuned for SSR + metadata generation. Lives
// here (not in lib/queries) so the slug page can keep its parallel
// 9-query pattern without polluting the shared client query module.

import { createClient } from "@/lib/supabase/server";

import type { CategoryItem, MetadataProduct } from "./types";
import type { ProductDetail } from "@/lib/queries/products";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface VariantRow {
  id: string;
  name: string | null;
  sku: string | null;
  description: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default: boolean;
  option_values: string[] | null;
}

interface ImageRow {
  id: string;
  variant_id: string | null;
  url: string;
  sort_order: number | null;
}

interface CategoryEdge {
  category_id: string;
  categories: { name: string; slug: string; is_active: boolean } | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function fetchBaseProduct(supabase: SupabaseServerClient, slug: string) {
  const isUUID = UUID_REGEX.test(slug);

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq(isUUID ? "id" : "slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

async function fetchAllRelations(
  supabase: SupabaseServerClient,
  product: { id: string; brand_id: string | null },
) {
  return Promise.all([
    supabase
      .from("product_images")
      .select("id, variant_id, url, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    product.brand_id
      ? supabase
          .from("brands")
          .select("id, name, slug, logo_url")
          .eq("id", product.brand_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("product_categories")
      .select("category_id, categories!inner(name, slug, is_active)")
      .eq("product_id", product.id)
      .eq("categories.is_active", true)
      .limit(1),
    supabase.from("reviews").select("rating").eq("product_id", product.id).eq("status", "approved"),
    supabase
      .from("product_variants")
      .select(
        "id, name, sku, description, price, discount_price, stock_quantity, is_default, option_values",
      )
      .eq("product_id", product.id)
      .eq("status", "active")
      .order("is_default", { ascending: false }),
    supabase.from("categories").select("id, name, slug, parent_id").eq("is_active", true),
    supabase.from("product_categories").select("category_id").eq("product_id", product.id),
    supabase
      .from("product_details")
      .select("id, type, content, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_rich_descriptions")
      .select("content, images")
      .eq("product_id", product.id)
      .maybeSingle(),
  ]);
}

function splitImages(allImages: ImageRow[]) {
  const productImages = allImages.filter((img) => img.variant_id === null).map((img) => img.url);
  return productImages;
}

function attachVariantImages(
  variants: VariantRow[],
  allImages: ImageRow[],
): Array<VariantRow & { images: string[] }> {
  return variants.map((v) => ({
    ...v,
    images: allImages.filter((img) => img.variant_id === v.id).map((img) => img.url),
  }));
}

function buildCategoryPath(
  allCategories: CategoryItem[] | null,
  productCatIds: Array<{ category_id: string }>,
): CategoryItem[] {
  if (!allCategories || productCatIds.length === 0) return [];

  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
  const productCategoryIds = productCatIds.map((pc) => pc.category_id);

  let deepestCat: CategoryItem | undefined;
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

  const path: CategoryItem[] = [];
  if (!deepestCat) return path;

  let currentCat: CategoryItem | undefined = deepestCat;
  while (currentCat) {
    path.unshift(currentCat);
    currentCat = currentCat.parent_id ? categoryMap.get(currentCat.parent_id) : undefined;
  }
  return path;
}

function computeReviewStats(reviews: Array<{ rating: number | null }>) {
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount : 0;
  return { reviewCount, averageRating };
}

function pickCategoryLabel(data: CategoryEdge | null): MetadataProduct["category"] {
  if (!data?.categories) return null;
  return { name: data.categories.name, slug: data.categories.slug };
}

function pickRichDescription(
  data: { content: string | null; images: string[] | null } | null,
): MetadataProduct["rich_description"] {
  if (!data) return undefined;
  return { content: data.content, images: data.images ?? [] };
}

function pickOptionGroups(metadata: ProductRow["metadata"]): MetadataProduct["option_groups"] {
  const optionGroups = metadata?.option_groups;
  if (!optionGroups || optionGroups.length === 0) return undefined;
  return optionGroups;
}

type ProductRow = {
  metadata?: {
    option_groups?: NonNullable<MetadataProduct["option_groups"]>;
  } | null;
};

/**
 * Server-side product fetch used by both `generateMetadata` and the page
 * render. Decomposed into small steps so the outer flow stays linear.
 *
 * The two-layer cache around this (React.cache + Upstash 300s) lives in
 * page.tsx — this function is the actual data assembly.
 */
export async function fetchProductForMetadata(slug: string): Promise<MetadataProduct | null> {
  const supabase = await createClient();
  const product = await fetchBaseProduct(supabase, slug);
  if (!product) return null;

  const [
    imagesResult,
    brandResult,
    categoriesResult,
    reviewsResult,
    variantsResult,
    allCategoriesResult,
    productCategoriesResult,
    detailsResult,
    richDescResult,
  ] = await fetchAllRelations(supabase, product);

  const allImages = (imagesResult.data ?? []) as ImageRow[];
  const productImages = splitImages(allImages);
  const variants = attachVariantImages((variantsResult.data ?? []) as VariantRow[], allImages);

  const brand = brandResult.data as MetadataProduct["brand"];
  const category = pickCategoryLabel((categoriesResult.data?.[0] ?? null) as CategoryEdge | null);
  const categoryPath = buildCategoryPath(
    (allCategoriesResult.data ?? null) as CategoryItem[] | null,
    (productCategoriesResult.data ?? []) as Array<{ category_id: string }>,
  );
  const { reviewCount, averageRating } = computeReviewStats(
    (reviewsResult.data ?? []) as Array<{ rating: number | null }>,
  );

  return {
    ...product,
    images: productImages,
    product_details: (detailsResult.data ?? []) as ProductDetail[],
    brand,
    category,
    reviewCount,
    averageRating,
    variants: variants.length > 0 ? variants : undefined,
    rich_description: pickRichDescription(richDescResult.data),
    categoryPath: categoryPath.length > 0 ? categoryPath : undefined,
    option_groups: pickOptionGroups(product.metadata as ProductRow["metadata"]),
  } as MetadataProduct;
}
