import { Metadata } from "next";

import { ProductsClient } from "@/components/product/ProductsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 300;

const description = `${BRAND.name} онлайн дэлгүүрийн бүх бүтээгдэхүүнүүд. Чанартай бараа, хямд үнэ, хурдан хүргэлт.`;
const title = `Бүтээгдэхүүн | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Бүтээгдэхүүн",
  description,
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/products`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function ProductsPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Бүтээгдэхүүн", url: "/products" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <ProductsClient />
    </>
  );
}
