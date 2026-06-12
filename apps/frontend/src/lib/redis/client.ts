import { Redis } from "@upstash/redis";

import { log } from "@/lib/utils/logger";

// Redis client singleton
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Aggressive client-side timeouts so a slow / unreachable Upstash node
// never blocks page render. The underlying undici fetch waits 10s by
// default; we cap reads at 1.5s and writes at 2s. On timeout we treat the
// cache as a miss and fall through to the data source (Supabase).
const READ_TIMEOUT_MS = 1500;
const WRITE_TIMEOUT_MS = 2000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Cache helper with SWR pattern. Redis failures + timeouts never block
// the response — the fetcher runs immediately and the cache write is
// fire-and-forget.
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60,
): Promise<T> {
  try {
    const cached = await withTimeout(redis.get<T>(key), READ_TIMEOUT_MS);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (error) {
    log.warn("redis_cache_miss_or_error", error);
  }

  const data = await fetcher();

  // Fire-and-forget cache write — don't await, don't block the response.
  // If Upstash is unreachable, the timeout above already proved that and
  // the write will likely also time out — no point waiting on it.
  withTimeout(redis.set(key, data, { ex: ttlSeconds }), WRITE_TIMEOUT_MS).catch((error) => {
    log.warn("redis_cache_set_failed", error);
  });

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
  productsList: (filters?: Record<string, unknown>) => `products:list:${stableKey(filters)}`,
  productDetail: (slug: string) => `products:detail:${slug}`,
  categoriesTree: () => "categories:tree",
  searchSuggestions: (prefix: string) => `search:suggestions:${prefix}`,
  userCart: (userId: string) => `user:${userId}:cart`,
  featuredProducts: () => "products:featured",
  homepageBanners: () => "homepage:banners",
  homepageBrands: () => "homepage:brands",
  homepageSettings: () => "homepage:settings",
  categoryProducts: (categoryId: string) => `home:category-products:${categoryId}`,
  brandsList: () => "brands:list",
  brandBySlug: (slug: string) => `brands:slug:${slug}`,
  brandDetail: (slug: string) => `brands:detail:${slug}`,
  articlesList: () => "articles:list",
  articleDetail: (slug: string) => `articles:detail:${slug}`,
  eventsList: () => "events:list",
  eventDetail: (slug: string) => `events:detail:${slug}`,
  sitemapData: () => "sitemap:data",
};
