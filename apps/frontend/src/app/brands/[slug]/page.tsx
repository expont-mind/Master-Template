import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BrandDetailClient } from "@/components/brand/BrandDetailClient";
import { BrandSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/utils/brand-config";
import { BASE_URL } from "@/lib/utils/constants";
import { log } from "@/lib/utils/logger";

export const revalidate = 300;

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  // Phantom columns that aren't in the live schema — kept optional
  // so TypeScript stays happy if they ever get added via a migration.
  banner_image?: string | null;
  type?: string | null;
}

// React.cache dedupes within one request (generateMetadata + page).
// getCachedOrFetch shares the brand row + product count across requests
// for 10 minutes — brands change rarely, so a longer TTL is fine.
const getBrandForMetadata = cache(async (slug: string) =>
  getCachedOrFetch(cacheKeys.brandDetail(slug), () => fetchBrandForMetadata(slug), 600),
);

async function fetchBrandForMetadata(slug: string) {
  const supabase = await createClient();

  const { data: brand, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .single();

  if (error) {
    log.error("brand_metadata_fetch_failed", error);
    return null;
  }

  if (!brand) return null;

  // Get product count for this brand
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brand.id)
    .eq("is_active", true);

  return {
    ...(brand as Brand),
    productCount: count ?? 0,
  };
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandForMetadata(slug);

  if (!brand) {
    return {
      title: "Брэнд олдсонгүй",
      description: "Хайсан брэнд олдсонгүй.",
    };
  }

  const description = `${brand.name} брэндийн бүтээгдэхүүнүүд (${brand.productCount} бүтээгдэхүүн). ${BRAND.name} онлайн дэлгүүрээс худалдаж аваарай.`;

  return {
    title: `${brand.name} бүтээгдэхүүнүүд`,
    description: description.slice(0, 160),
    keywords: [brand.name, "брэнд", "бүтээгдэхүүн", "худалдаа", "онлайн дэлгүүр"],
    alternates: {
      canonical: `/brands/${brand.slug}`,
    },
    openGraph: {
      title: `${brand.name} бүтээгдэхүүнүүд`,
      description: description.slice(0, 160),
      url: `${BASE_URL}/brands/${brand.slug}`,
      type: "website",
      images: brand.logo_url
        ? [
            {
              url: brand.logo_url,
              width: 400,
              height: 400,
              alt: brand.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} бүтээгдэхүүнүүд`,
      description: description.slice(0, 160),
      images: brand.logo_url ? [brand.logo_url] : [],
    },
  };
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await getBrandForMetadata(slug);

  if (!brand) {
    notFound();
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Брэнд", url: "/brands" },
    { name: brand.name, url: `/brands/${brand.slug}` },
  ];

  return (
    <>
      <BrandSchema
        name={brand.name}
        slug={brand.slug}
        logo={brand.logo_url || undefined}
        productCount={brand.productCount}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <BrandDetailClient slug={slug} initialBrand={brand} />
    </>
  );
}
