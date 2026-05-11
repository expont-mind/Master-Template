import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { createClient } from "@/lib/supabase/server";
import { productKeys } from "@/lib/queries/products";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BASE_URL } from "@/lib/utils/constants";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import type { Product } from "@/types/database";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Server-side function to get product data for metadata.
// Two stacked caches:
//   1. React.cache(): dedupes calls within ONE request
//      (generateMetadata + page render).
//   2. getCachedOrFetch (Upstash, 300s): shares across requests so the
//      9 parallel Supabase queries below only run once per 5-minute
//      window per product. TTL matches `revalidate = 300` above.
const getProductForMetadata = cache(async (slug: string) =>
  getCachedOrFetch(
    cacheKeys.productDetail(slug),
    () => fetchProductForMetadata(slug),
    300,
  ),
);

async function fetchProductForMetadata(slug: string) {
  const supabase = await createClient();

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    );

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq(isUUID ? "id" : "slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) return null;

  // Fetch images, brand, category, review summary, variants, details, and rich description in parallel
  const [imagesResult, brandResult, categoriesResult, reviewsResult, variantsResult, allCategoriesResult, productCategoriesResult, detailsResult, richDescResult] =
    await Promise.all([
      supabase
        .from("product_images")
        .select("id, variant_id, url, sort_order")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
      product.brand_id
        ? (supabase as any)
            .from("brands")
            .select("id, name, slug, logo_url")
            .eq("id", product.brand_id)
            .single()
        : Promise.resolve({ data: null }),
      (supabase as any)
        .from("product_categories")
        .select("category_id, categories!inner(name, slug, is_active)")
        .eq("product_id", product.id)
        .eq("categories.is_active", true)
        .limit(1),
      supabase
        .from("reviews")
        .select("rating")
        .eq("product_id", product.id)
        .eq("status", "approved" as any),
      supabase
        .from("product_variants")
        .select("id, name, sku, description, price, discount_price, stock_quantity, is_default, option_values")
        .eq("product_id", product.id)
        .eq("status", "active" as any)
        .order("is_default", { ascending: false }),
      supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("is_active", true),
      (supabase as any)
        .from("product_categories")
        .select("category_id")
        .eq("product_id", product.id),
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

  // Extract product-level images (variant_id is null)
  const productImages = (imagesResult.data || [])
    .filter((img: { variant_id: string | null; url: string }) => img.variant_id === null)
    .map((img: { url: string }) => img.url);

  // Map images to variants
  const variants = (variantsResult.data || []).map((v: any) => ({
    ...v,
    images: (imagesResult.data || [])
      .filter((img: { variant_id: string | null }) => img.variant_id === v.id)
      .map((img: { url: string }) => img.url),
  }));

  const brand = brandResult.data as { id: string; name: string; slug: string; logo_url: string | null } | null;
  const categoryData = categoriesResult.data?.[0] as {
    categories: { name: string; slug: string } | null;
  } | null;
  const category = categoryData?.categories || null;

  // Build category path (from root to the deepest category)
  type CategoryItem = { id: string; name: string; slug: string; parent_id: string | null };
  let categoryPath: CategoryItem[] = [];
  const productCatIds = (productCategoriesResult.data as { category_id: string }[] | null) ?? [];

  if (allCategoriesResult.data && productCatIds.length > 0) {
    const allCategories = allCategoriesResult.data as CategoryItem[];
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
    const productCategoryIds = productCatIds.map((pc) => pc.category_id);

    // Find the deepest category (one with most ancestors)
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

    // Build path from root to deepest category
    if (deepestCat) {
      let currentCat: CategoryItem | undefined = deepestCat;
      while (currentCat) {
        categoryPath.unshift(currentCat);
        currentCat = currentCat.parent_id ? categoryMap.get(currentCat.parent_id) : undefined;
      }
    }
  }

  // Calculate review stats
  const reviews = reviewsResult.data || [];
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
      : 0;

  // Extract option_groups from metadata
  const metadata = product.metadata as { option_groups?: Array<{ type: string; values: string[]; is_required?: boolean }> } | null;
  const option_groups = metadata?.option_groups;

  return {
    ...product,
    images: productImages,
    product_details: detailsResult.data || [],
    brand,
    category,
    reviewCount,
    averageRating,
    variants: variants.length > 0 ? variants : undefined,
    rich_description: richDescResult.data
      ? {
          content: richDescResult.data.content,
          images: (richDescResult.data as any).images ?? [],
        }
      : undefined,
    categoryPath: categoryPath.length > 0 ? categoryPath : undefined,
    option_groups: option_groups && option_groups.length > 0 ? option_groups : undefined,
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductForMetadata(slug);

  if (!product) {
    return {
      title: "Бүтээгдэхүүн олдсонгүй",
      description: "Хайсан бүтээгдэхүүн олдсонгүй.",
    };
  }

  const hasDiscount =
    product.discount_price != null &&
    product.discount_price > 0 &&
    product.discount_price < product.price;
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const priceText = `${displayPrice?.toLocaleString()}₮`;

  const description =
    product.description ||
    `${product.name} - ${priceText}. Monpang онлайн дэлгүүрээс худалдаж аваарай.`;

  return {
    title: product.name,
    description: description.slice(0, 160),
    keywords: [
      product.name,
      product.brand?.name,
      product.category?.name,
      "худалдаа",
      "онлайн дэлгүүр",
    ].filter(Boolean) as string[],
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: description.slice(0, 160),
      url: `${BASE_URL}/products/${product.slug}`,
      type: "website",
      images: product.images?.[0]
        ? [
            {
              url: product.images[0],
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description.slice(0, 160),
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductForMetadata(slug);

  if (!product) {
    notFound();
  }

  const queryClient = getQueryClient();

  // Pre-populate the query cache with the product data
  queryClient.setQueryData(productKeys.detail(slug), product);

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Бүтээгдэхүүн", url: "/products" },
  ];

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `/products?category=${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: `/products/${product.slug}`,
  });

  return (
    <>
      <ProductSchema
        product={product as Product}
        reviewCount={product.reviewCount}
        averageRating={product.averageRating}
        brandName={product.brand?.name}
        categoryName={product.category?.name}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductDetailClient slug={slug} serverProduct={product} />
      </HydrationBoundary>
    </>
  );
}
