import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/utils/constants";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";

interface SitemapRow {
  slug: string | null;
  updated_at: string | null;
}

interface SitemapData {
  products: SitemapRow[];
  brands: SitemapRow[];
  categories: SitemapRow[];
  articles: SitemapRow[];
  events: SitemapRow[];
}

// 30-minute Upstash cache. Crawlers hit /sitemap.xml repeatedly; without
// this each hit fired 5 table scans. Long TTL is safe — sitemap freshness
// of half an hour is well within Google's expected crawl cadence.
async function fetchSitemapData(): Promise<SitemapData> {
  const supabase = await createClient();
  const [productsResult, brandsResult, categoriesResult, articlesResult, eventsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("brands")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("articles")
        .select("slug, updated_at")
        .eq("status", "published"),
      supabase.from("events").select("slug, updated_at"),
    ]);

  return {
    products: (productsResult.data as SitemapRow[] | null) ?? [],
    brands: (brandsResult.data as SitemapRow[] | null) ?? [],
    categories: (categoriesResult.data as SitemapRow[] | null) ?? [],
    articles: (articlesResult.data as SitemapRow[] | null) ?? [],
    events: (eventsResult.data as SitemapRow[] | null) ?? [],
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, brands, categories, articles, events } =
    await getCachedOrFetch<SitemapData>(
      cacheKeys.sitemapData(),
      fetchSitemapData,
      1800,
    );

  const productUrls: MetadataRoute.Sitemap = products
    .filter((p): p is SitemapRow & { slug: string } => !!p.slug)
    .map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const brandUrls: MetadataRoute.Sitemap = brands
    .filter((b): b is SitemapRow & { slug: string } => !!b.slug)
    .map((brand) => ({
      url: `${BASE_URL}/brands/${brand.slug}`,
      lastModified: brand.updated_at ? new Date(brand.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const categoryUrls: MetadataRoute.Sitemap = categories
    .filter((c): c is SitemapRow & { slug: string } => !!c.slug)
    .map((category) => ({
      url: `${BASE_URL}/products?category=${category.slug}`,
      lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const articleUrls: MetadataRoute.Sitemap = articles
    .filter((a): a is SitemapRow & { slug: string } => !!a.slug)
    .map((article) => ({
      url: `${BASE_URL}/articles/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  const eventUrls: MetadataRoute.Sitemap = events
    .filter((e): e is SitemapRow & { slug: string } => !!e.slug)
    .map((event) => ({
      url: `${BASE_URL}/events/${event.slug}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  // Static pages — include the indexable static content pages we missed.
  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/best-sellers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/new-arrivals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/branches`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticUrls,
    ...productUrls,
    ...brandUrls,
    ...categoryUrls,
    ...articleUrls,
    ...eventUrls,
  ];
}
