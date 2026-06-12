import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";
import { getQueryClient } from "@/lib/get-query-client";
import { productKeys } from "@/lib/queries/products";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import { ROUTES } from "@/lib/utils/constants";

import { buildProductMetadata, NOT_FOUND_METADATA } from "./_lib/buildMetadata";
import { fetchProductForMetadata } from "./_lib/fetchProductForMetadata";

import type { Product } from "@/types/database";

export const revalidate = 300;

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
  getCachedOrFetch(cacheKeys.productDetail(slug), () => fetchProductForMetadata(slug), 300),
);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductForMetadata(slug);
  if (!product) return NOT_FOUND_METADATA;
  return buildProductMetadata(product);
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
      url: ROUTES.CATEGORY(product.category.slug),
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: ROUTES.PRODUCT(product.slug),
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
