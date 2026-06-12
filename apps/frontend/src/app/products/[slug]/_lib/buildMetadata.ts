import { BRAND } from "@/lib/utils/brand-config";
import { BASE_URL, ROUTES } from "@/lib/utils/constants";

import type { MetadataProduct } from "./types";
import type { Metadata } from "next";

/** Display price honours discount when it's > 0 AND below the base price. */
function pickDisplayPrice(product: MetadataProduct): number {
  const hasDiscount =
    product.discount_price != null &&
    product.discount_price > 0 &&
    product.discount_price < product.price;
  return hasDiscount ? (product.discount_price as number) : product.price;
}

/**
 * Description falls back to a templated string when `description` is
 * missing on the product. Always clamped to 160 chars at the call site.
 */
function buildDescription(product: MetadataProduct): string {
  if (product.description) return product.description;
  const priceText = `${pickDisplayPrice(product).toLocaleString()}₮`;
  return `${product.name} - ${priceText}. ${BRAND.name} онлайн дэлгүүрээс худалдаж аваарай.`;
}

/** Up to 5 keywords: product name + brand + category + two fixed terms. */
function buildKeywords(product: MetadataProduct): string[] {
  return [
    product.name,
    product.brand?.name,
    product.category?.name,
    "худалдаа",
    "онлайн дэлгүүр",
  ].filter(Boolean) as string[];
}

function buildOpenGraphImages(
  product: MetadataProduct,
): NonNullable<Metadata["openGraph"]>["images"] {
  if (!product.images?.[0]) return [];
  return [
    {
      url: product.images[0],
      width: 800,
      height: 800,
      alt: product.name,
    },
  ];
}

/** Generates the full metadata object for a product detail page. */
export function buildProductMetadata(product: MetadataProduct): Metadata {
  const description = buildDescription(product).slice(0, 160);

  return {
    title: product.name,
    description,
    keywords: buildKeywords(product),
    alternates: {
      canonical: ROUTES.PRODUCT(product.slug),
    },
    openGraph: {
      title: product.name,
      description,
      url: `${BASE_URL}${ROUTES.PRODUCT(product.slug)}`,
      type: "website",
      images: buildOpenGraphImages(product),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

/** Metadata returned when the slug doesn't resolve to an active product. */
export const NOT_FOUND_METADATA: Metadata = {
  title: "Бүтээгдэхүүн олдсонгүй",
  description: "Хайсан бүтээгдэхүүн олдсонгүй.",
};
