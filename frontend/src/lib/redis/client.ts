import { Redis } from "@upstash/redis";
import { log } from "@/lib/utils/logger";

// Redis client singleton
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helper with SWR pattern
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60,
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    log.warn("redis_cache_miss_or_error", error);
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    log.warn("redis_cache_set_failed", error);
  }

  return data;
}

// Cache invalidation helper
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    log.warn("redis_cache_invalidation_failed", error);
  }
}

// Common cache key patterns. Keep keys deterministic and parameter-complete
// — partial keys would silently return wrong data when callers vary other
// filters. When a key takes structured input, JSON-stringify a normalized
// object so two equivalent inputs hash to the same key.
function stableKey(input: unknown): string {
  if (input === undefined || input === null) return "";
  if (typeof input !== "object") return String(input);
  // Sort object keys for deterministic stringification.
  const sorted = Object.keys(input as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      const v = (input as Record<string, unknown>)[k];
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

export const cacheKeys = {
  productsList: (filters?: Record<string, unknown>) =>
    `products:list:${stableKey(filters)}`,
  productDetail: (slug: string) => `products:detail:${slug}`,
  categoriesTree: () => "categories:tree",
  searchSuggestions: (prefix: string) => `search:suggestions:${prefix}`,
  userCart: (userId: string) => `user:${userId}:cart`,
  featuredProducts: () => "products:featured",
  homepageBanners: () => "homepage:banners",
  homepageBrands: () => "homepage:brands",
  homepageSettings: () => "homepage:settings",
  categoryProducts: (categoryId: string) =>
    `home:category-products:${categoryId}`,
  brandsList: () => "brands:list",
  brandBySlug: (slug: string) => `brands:slug:${slug}`,
  brandDetail: (slug: string) => `brands:detail:${slug}`,
  articlesList: () => "articles:list",
  articleDetail: (slug: string) => `articles:detail:${slug}`,
  eventsList: () => "events:list",
  eventDetail: (slug: string) => `events:detail:${slug}`,
  sitemapData: () => "sitemap:data",
};
