import { Metadata } from "next";
import { BrandsClient } from "@/components/brand/BrandsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Брэндүүд",
  description:
    "Monpang дээрх бүх брэндүүд. Дэлхийн шилдэг брэндийн бүтээгдэхүүнүүдийг худалдаж аваарай.",
  alternates: {
    canonical: "/brands",
  },
  openGraph: {
    title: "Брэндүүд | Monpang",
    description:
      "Monpang дээрх бүх брэндүүд. Дэлхийн шилдэг брэндийн бүтээгдэхүүнүүдийг худалдаж аваарай.",
    url: "https://monpang.com/brands",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Брэндүүд | Monpang",
    description:
      "Monpang дээрх бүх брэндүүд. Дэлхийн шилдэг брэндийн бүтээгдэхүүнүүдийг худалдаж аваарай.",
  },
};

export default function BrandsPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Брэнд", url: "/brands" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <BrandsClient />
    </>
  );
}
