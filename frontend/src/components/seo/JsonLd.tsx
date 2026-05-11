import type { Product } from "@/types/database";
import { BASE_URL } from "@/lib/utils/constants";

interface BreadcrumbItem {
  name: string;
  url: string;
}

// Organization Schema - for the homepage/layout
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Monpang",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.svg`,
    description:
      "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "MN",
      addressLocality: "Улаанбаатар",
    },
    sameAs: [
      // Add social media URLs when available
      // "https://facebook.com/monpang",
      // "https://instagram.com/monpang",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// WebSite Schema with SearchAction - for homepage
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Monpang",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Product Schema
interface ProductSchemaProps {
  product: Product;
  reviewCount?: number;
  averageRating?: number;
  brandName?: string;
  categoryName?: string;
}

export function ProductSchema({
  product,
  reviewCount = 0,
  averageRating = 0,
  brandName,
  categoryName,
}: ProductSchemaProps) {
  const hasDiscount =
    product.discount_price != null &&
    product.discount_price > 0 &&
    product.discount_price < product.price;
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const inStock = (product.stock_quantity ?? 0) > 0;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.images?.[0] ? [product.images[0]] : [],
    url: `${BASE_URL}/products/${product.slug}`,
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${product.slug}`,
      priceCurrency: "MNT",
      price: displayPrice,
      priceValidUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Monpang",
      },
    },
  };

  if (brandName) {
    schema.brand = {
      "@type": "Brand",
      name: brandName,
    };
  }

  if (categoryName) {
    schema.category = categoryName;
  }

  if (reviewCount > 0 && averageRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// BreadcrumbList Schema
interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ItemList Schema for category/listing pages
interface ItemListSchemaProps {
  name: string;
  description?: string;
  items: Array<{
    name: string;
    url: string;
    image?: string;
    position: number;
  }>;
}

export function ItemListSchema({ name, description, items }: ItemListSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      name: item.name,
      image: item.image,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Brand Schema
interface BrandSchemaProps {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  productCount?: number;
}

export function BrandSchema({
  name,
  slug,
  description,
  logo,
}: BrandSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name,
    url: `${BASE_URL}/brands/${slug}`,
    description: description || `${name} бүтээгдэхүүнүүд Monpang дээр`,
    logo,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// SiteNavigationElement Schema - tells Google your main navigation links
export function SiteNavigationSchema() {
  const navItems = [
    { name: "Бүтээгдэхүүн", url: `${BASE_URL}/products` },
    { name: "Брэндүүд", url: `${BASE_URL}/brands` },
    { name: "Их борлуулагдсан", url: `${BASE_URL}/best-sellers` },
    { name: "Шинээр нэмэгдсэн", url: `${BASE_URL}/new-arrivals` },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: navItems.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
