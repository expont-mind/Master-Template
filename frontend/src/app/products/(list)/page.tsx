import { Metadata } from "next";
import { ProductsClient } from "@/components/product/ProductsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Бүтээгдэхүүн",
  description:
    "Monpang онлайн дэлгүүрийн бүх бүтээгдэхүүнүүд. Чанартай бараа, хямд үнэ, хурдан хүргэлт.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Бүтээгдэхүүн | Monpang",
    description:
      "Monpang онлайн дэлгүүрийн бүх бүтээгдэхүүнүүд. Чанартай бараа, хямд үнэ, хурдан хүргэлт.",
    url: "https://monpang.com/products",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Бүтээгдэхүүн | Monpang",
    description:
      "Monpang онлайн дэлгүүрийн бүх бүтээгдэхүүнүүд. Чанартай бараа, хямд үнэ, хурдан хүргэлт.",
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
