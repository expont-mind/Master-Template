import { ROUTES } from "@/lib/utils/constants";

export interface CarouselBanner {
  id: string;
  image_url: string;
  mobile_image_url?: string | null;
  background_color?: string;
  mobile_background_color?: string | null;
  category_id: string | null;
  product_id: string | null;
  link_url: string | null;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price: number | null;
    images: string[] | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ResolvedSlide {
  id: string;
  image: string;
  bgColor: string;
  link: string | null;
  hasLink: boolean;
}

function resolveBannerLink(banner: CarouselBanner): string | null {
  if (banner.product_id) {
    return ROUTES.PRODUCT(banner.product?.slug || banner.product_id);
  }
  if (banner.category_id) {
    return banner.category?.slug ? ROUTES.CATEGORY(banner.category.slug) : ROUTES.PRODUCTS;
  }
  return banner.link_url ?? null;
}

export function buildSlides(
  banners: CarouselBanner[] | undefined,
  isMobile: boolean,
): ResolvedSlide[] {
  if (!banners || banners.length === 0) return [];
  return banners.map((b) => {
    const desktopImage = b.image_url || b.product?.images?.[0] || "";
    const mobileImage = b.mobile_image_url || desktopImage;
    const desktopBgColor = b.background_color || "#ffffff";
    const mobileBgColor = b.mobile_background_color || desktopBgColor;
    return {
      id: b.id,
      image: isMobile ? mobileImage : desktopImage,
      bgColor: isMobile ? mobileBgColor : desktopBgColor,
      link: resolveBannerLink(b),
      hasLink: !!(b.product_id || b.category_id || b.link_url),
    };
  });
}
