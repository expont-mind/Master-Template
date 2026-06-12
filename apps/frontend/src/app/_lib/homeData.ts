import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import { log } from "@/lib/utils/logger";

import type { CarouselBanner } from "@/components/home/Carousel";
import type { Category } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Banner queries are the same for every visitor; cache the result in
// Redis for 60s so we don't hit Supabase once per cold SSR request.
// This mirrors the frontend ISR TTL and shields the DB from the same
// query storm that took the site down on 2026-04-19.
export const BANNERS_CACHE_TTL = 60;

export type PromoBanner = {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  background_color: string;
  mobile_background_color: string | null;
  link_url: string | null;
  category_id: string | null;
  product_id: string | null;
  sort_order: number;
  product?: { slug: string } | null;
  category?: { slug: string } | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Setting = { key: string; value: string };

// Accepts any thenable that resolves to a Supabase-style { data, error }
// envelope. The caller's T constrains the eventual return type; the data
// shape from Supabase joins doesn't always line up structurally with T,
// so we cast at the boundary.
export async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: unknown; error: unknown }>,
  fallback: T,
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      log.error("home_query_error", error);
      return fallback;
    }
    return (data as T | null) ?? fallback;
  } catch (err) {
    log.error("home_unexpected_error", err);
    return fallback;
  }
}

export async function fetchCarouselBanners(supabase: SupabaseClient): Promise<CarouselBanner[]> {
  const emptyCarouselBanners: CarouselBanner[] = [];
  return getCachedOrFetch<CarouselBanner[]>(
    `${cacheKeys.homepageBanners()}:carousel`,
    () =>
      safeQuery<CarouselBanner[]>(
        () =>
          supabase
            .from("banners")
            .select(
              `*,
            product:products(id, name, slug, price, discount_price, images),
            category:categories(id, name, slug)`,
            )
            .eq("is_active", true)
            .eq("type", "carousel")
            .order("sort_order")
            .limit(10),
        emptyCarouselBanners,
      ),
    BANNERS_CACHE_TTL,
  );
}

export async function fetchPromoBanners(supabase: SupabaseClient): Promise<PromoBanner[]> {
  const emptyPromoBanners: PromoBanner[] = [];
  return getCachedOrFetch<PromoBanner[]>(
    `${cacheKeys.homepageBanners()}:promo`,
    () =>
      safeQuery<PromoBanner[]>(
        () =>
          (
            supabase.from("banners") as unknown as {
              select: (s: string) => {
                eq: (
                  k: string,
                  v: unknown,
                ) => {
                  eq: (
                    k: string,
                    v: unknown,
                  ) => {
                    order: (o: string) => {
                      limit: (n: number) => Promise<{
                        data: PromoBanner[] | null;
                        error: unknown;
                      }>;
                    };
                  };
                };
              };
            }
          )
            .select(
              `id, image_url, mobile_image_url, background_color, mobile_background_color, link_url, category_id, product_id, sort_order,
            product:products(slug),
            category:categories(slug)`,
            )
            .eq("is_active", true)
            .eq("type", "promo")
            .order("sort_order")
            .limit(20),
        emptyPromoBanners,
      ),
    BANNERS_CACHE_TTL,
  );
}

export async function fetchParentCategories(supabase: SupabaseClient): Promise<Category[]> {
  const emptyCategories: Category[] = [];
  return safeQuery(
    () =>
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order"),
    emptyCategories,
  );
}

export async function fetchFeaturedCategories(supabase: SupabaseClient): Promise<Category[]> {
  const emptyCategories: Category[] = [];
  return safeQuery(
    () =>
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order"),
    emptyCategories,
  );
}

export async function fetchBrands(supabase: SupabaseClient): Promise<Brand[]> {
  return getCachedOrFetch<Brand[]>(
    cacheKeys.homepageBrands(),
    async () => {
      try {
        const { data } = await (
          supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                order: (o: string) => {
                  limit: (n: number) => Promise<{ data: Brand[] | null }>;
                };
              };
            };
          }
        )
          .from("brands")
          .select("id, name, slug, logo_url")
          .order("name")
          .limit(10);
        return data ?? [];
      } catch {
        return [];
      }
    },
    3600,
  );
}

export async function fetchBrandSectionSettings(
  supabase: SupabaseClient,
): Promise<{ title: string; icon: string }> {
  return getCachedOrFetch<{ title: string; icon: string }>(
    cacheKeys.homepageSettings(),
    async () => {
      let title = "";
      let icon = "";
      try {
        const { data: settingsData } = await (
          supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                in: (col: string, vals: string[]) => Promise<{ data: Setting[] | null }>;
              };
            };
          }
        )
          .from("settings")
          .select("key, value")
          .in("key", ["brand_section_title", "brand_section_icon"]);
        for (const s of settingsData ?? []) {
          if (s.key === "brand_section_title") title = s.value;
          if (s.key === "brand_section_icon") icon = s.value;
        }
      } catch {
        // use defaults
      }
      return { title, icon };
    },
    3600,
  );
}

export function groupPromoBannersBySlot(promoBanners: PromoBanner[]): PromoBanner[][] {
  const bannersBySortOrder = promoBanners.reduce(
    (acc, banner) => {
      const order = banner.sort_order;
      if (!acc[order]) acc[order] = [];
      acc[order].push(banner);
      return acc;
    },
    {} as Record<number, PromoBanner[]>,
  );

  const sortedOrders = Object.keys(bannersBySortOrder)
    .map(Number)
    .sort((a, b) => a - b);
  return sortedOrders.map((order) => bannersBySortOrder[order]);
}
