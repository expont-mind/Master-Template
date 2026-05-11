import { createClient } from "@/lib/supabase/server";

// ISR: regenerate the home page at most once per minute. The Redis caches
// below shorten DB pressure further; revalidate gives Next.js permission
// to serve a cached HTML shell instead of dynamic SSR per request.
export const revalidate = 60;

import {
  Carousel,
  Categories,
  Section,
  TimedSaleSection,
  BrandLogoSection,
  RotatingPromoBanner,
  ReviewPrompt,
  PointActivationPrompt,
} from "@/components/home";
import type { CarouselBanner } from "@/components/home/Carousel";
import { ROUTES } from "@/lib/utils/constants";
import type { Product, Category } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WebSiteSchema } from "@/components/seo/JsonLd";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error("[Home] Query error:", error);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.error("[Home] Unexpected error:", err);
    return fallback;
  }
}

// Fetch product images from product_images table and merge with products (with batching)
async function attachProductImages(
  supabase: SupabaseClient,
  products: Product[],
): Promise<Product[]> {
  if (products.length === 0) return products;

  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  // Fetch in batches in parallel to avoid URL length limit AND serial latency.
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

// Fetch products for featured categories with random-offset sampling so
// every product in the category (not just the newest N) has a chance to
// surface on the home screen.
//
// Performance contract:
// - Counts are cached in Redis for 5 min (rarely change, HEAD-only req).
// - The 10-row fetch runs per render but is throttled by Next.js ISR
//   (`revalidate = 60`), so DB hit rate stays at ~1/min/category.
// - Every regeneration picks a fresh random offset, so the visible slice
//   rotates over time and covers the full catalog.
async function fetchCategoryProducts(
  supabase: SupabaseClient,
  categoryIds: string[],
  limit: number = 10,
): Promise<Map<string, Product[]>> {
  const productsByCategory = new Map<string, Product[]>();
  if (categoryIds.length === 0) return productsByCategory;

  // 1. Cache count per category (5 min — counts move slowly).
  const counts = await Promise.all(
    categoryIds.map((categoryId) =>
      getCachedOrFetch<number>(
        `${cacheKeys.categoryProducts(categoryId)}:count`,
        async () => {
          const { count } = await supabase
            .from("products")
            .select("*, product_categories!inner(category_id)", {
              count: "exact",
              head: true,
            })
            .eq("product_categories.category_id", categoryId)
            .eq("is_active", true);
          return count ?? 0;
        },
        300,
      ),
    ),
  );

  // 2. Per category, pick a random offset and fetch `limit` rows.
  const fetches = await Promise.all(
    categoryIds.map(async (categoryId, i) => {
      const total = counts[i];
      if (total === 0) return [] as Product[];

      const maxOffset = Math.max(0, total - limit);
      const offset = Math.floor(Math.random() * (maxOffset + 1));

      const { data } = await supabase
        .from("products")
        .select("*, product_categories!inner(category_id)")
        .eq("product_categories.category_id", categoryId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const products = ((data as Product[] | null) ?? []).slice();
      // Shuffle the 10 so display order is also random.
      for (let j = products.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [products[j], products[k]] = [products[k], products[j]];
      }
      return products;
    }),
  );

  for (let i = 0; i < categoryIds.length; i++) {
    if (fetches[i].length > 0) {
      productsByCategory.set(categoryIds[i], fetches[i]);
    }
  }

  return productsByCategory;
}

export default async function Home() {
  const supabase = await createClient();

  const emptyCategories: Category[] = [];
  const emptyCarouselBanners: CarouselBanner[] = [];

  type PromoBanner = {
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
  const emptyPromoBanners: PromoBanner[] = [];

  // Banner queries are the same for every visitor; cache the result in
  // Redis for 60s so we don't hit Supabase once per cold SSR request.
  // This mirrors the frontend ISR TTL and shields the DB from the same
  // query storm that took the site down on 2026-04-19.
  const BANNERS_CACHE_TTL = 60;

  const [carouselBanners, promoBanners, allCategories, featuredCategories] =
    await Promise.all([
      getCachedOrFetch<CarouselBanner[]>(
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
      ),
      getCachedOrFetch<PromoBanner[]>(
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
      ),
      // Parent categories only for the icon row
      safeQuery(
        () =>
          supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .is("parent_id", null)
            .order("sort_order"),
        emptyCategories,
      ),
      // Featured categories for product sections
      safeQuery(
        () =>
          supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .eq("is_featured", true)
            .order("sort_order"),
        emptyCategories,
      ),
    ]);

  // Fetch brands separately (not in generated types). Brands list rarely
  // changes; cache for 1 hour to shield Supabase from repeated SSR hits.
  type Brand = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  const brands: Brand[] = await getCachedOrFetch<Brand[]>(
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

  // Brand section settings — admin-curated, also cache for 1 hour.
  type Setting = { key: string; value: string };
  const brandSection = await getCachedOrFetch<{ title: string; icon: string }>(
    cacheKeys.homepageSettings(),
    async () => {
      let title = "";
      let icon = "";
      try {
        const { data: settingsData } = await (
          supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                in: (
                  col: string,
                  vals: string[],
                ) => Promise<{ data: Setting[] | null }>;
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
  const brandSectionTitle = brandSection.title;
  const brandSectionIcon = brandSection.icon;

  // Fetch products for each featured category
  const categoryIds = featuredCategories.map((c) => c.id);
  const productsByCategory = await fetchCategoryProducts(supabase, categoryIds);
  const categoryProducts = Array.from(productsByCategory.values()).flat();

  // Fetch and attach images to category products
  const productsWithImages = await attachProductImages(
    supabase,
    categoryProducts,
  );
  const imageMap = new Map<string, Product>();
  for (const p of productsWithImages) {
    imageMap.set(p.id, p);
  }

  // Helper to get products with images
  const withImages = (products: Product[]) =>
    products.map((p) => imageMap.get(p.id) || p);

  // Group banners by sort_order
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
  const promoSlots = sortedOrders.map((order) => bannersBySortOrder[order]);

  return (
    <div className="flex flex-col w-full">
      <WebSiteSchema />
      <PointActivationPrompt />
      <Carousel banners={carouselBanners} />
      <Categories categories={allCategories} />
      <div className="py-2 bg-white px-4 md:px-0">
        <div className="w-full max-w-[1064px] mx-auto h-px bg-border" />
      </div>

      <ReviewPrompt />

      {/* Dynamic category sections with brands after first and banners between */}
      {featuredCategories.map((category, index) => {
        const products = productsByCategory.get(category.id) || [];
        if (products.length === 0) return null;

        const isTimedSale = category.slug === "hugatsaatai-hymdral";

        const categorySection = isTimedSale ? (
          <TimedSaleSection
            key={category.id}
            products={withImages(products)}
            href={ROUTES.CATEGORY(category.slug)}
            iconSrc={category.image || undefined}
          />
        ) : (
          <Section
            key={category.id}
            title={category.name}
            iconSrc={category.image || undefined}
            href={ROUTES.CATEGORY(category.slug)}
            products={withImages(products)}
          />
        );

        // Show brands section after the first category
        if (index === 0) {
          return (
            <div key={category.id}>
              {categorySection}
              <BrandLogoSection
                brands={brands}
                title={brandSectionTitle || undefined}
                iconSrc={brandSectionIcon || undefined}
              />
            </div>
          );
        }

        // Show promo banner at index 2 (first promo banner)
        if (index === 2 && promoSlots[0]) {
          return (
            <div key={category.id}>
              <RotatingPromoBanner banners={promoSlots[0]} />
              {categorySection}
            </div>
          );
        }

        // Show promo banner at index 7 (second promo banner - after 4 sections)
        if (index === 7 && promoSlots[1]) {
          return (
            <div key={category.id}>
              <RotatingPromoBanner banners={promoSlots[1]} />
              {categorySection}
            </div>
          );
        }

        return categorySection;
      })}

      {/* Final promo banner at the bottom (third promo banner) */}
      {promoSlots[2] && <RotatingPromoBanner banners={promoSlots[2]} />}
    </div>
  );
}
