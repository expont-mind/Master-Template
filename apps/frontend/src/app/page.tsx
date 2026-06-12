import {
  Carousel,
  Categories,
  RotatingPromoBanner,
  ReviewPrompt,
  PointActivationPrompt,
} from "@/components/home";
import { WebSiteSchema } from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";

import { HomeCategorySections } from "./_components/HomeCategorySections";
import {
  fetchBrandSectionSettings,
  fetchBrands,
  fetchCarouselBanners,
  fetchFeaturedCategories,
  fetchParentCategories,
  fetchPromoBanners,
  groupPromoBannersBySlot,
} from "./_lib/homeData";
import { attachProductImages, fetchCategoryProducts } from "./_lib/homeProducts";

import type { Product } from "@/types/database";

// ISR: regenerate the home page at most once per minute. The Redis caches
// below shorten DB pressure further; revalidate gives Next.js permission
// to serve a cached HTML shell instead of dynamic SSR per request.
export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const [carouselBanners, promoBanners, allCategories, featuredCategories] = await Promise.all([
    fetchCarouselBanners(supabase),
    fetchPromoBanners(supabase),
    fetchParentCategories(supabase),
    fetchFeaturedCategories(supabase),
  ]);

  // Brands list rarely changes; cache for 1 hour to shield Supabase.
  const brands = await fetchBrands(supabase);

  // Brand section settings — admin-curated, also cache for 1 hour.
  const brandSection = await fetchBrandSectionSettings(supabase);
  const brandSectionTitle = brandSection.title;
  const brandSectionIcon = brandSection.icon;

  // Fetch products for each featured category
  const categoryIds = featuredCategories.map((c) => c.id);
  const productsByCategory = await fetchCategoryProducts(supabase, categoryIds);
  const categoryProducts = Array.from(productsByCategory.values()).flat();

  // Fetch and attach images to category products
  const productsWithImages = await attachProductImages(supabase, categoryProducts);
  const imageMap = new Map<string, Product>();
  for (const p of productsWithImages) {
    imageMap.set(p.id, p);
  }

  // Helper to get products with images
  const withImages = (products: Product[]) => products.map((p) => imageMap.get(p.id) || p);

  // Group banners by sort_order
  const promoSlots = groupPromoBannersBySlot(promoBanners);

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
      <HomeCategorySections
        featuredCategories={featuredCategories}
        productsByCategory={productsByCategory}
        withImages={withImages}
        brands={brands}
        brandSectionTitle={brandSectionTitle}
        brandSectionIcon={brandSectionIcon}
        promoSlots={promoSlots}
      />

      {/* Final promo banner at the bottom (third promo banner) */}
      {promoSlots[2] && <RotatingPromoBanner banners={promoSlots[2]} />}
    </div>
  );
}
