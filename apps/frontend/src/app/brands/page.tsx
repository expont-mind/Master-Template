import { Metadata } from "next";

import { BrandsClient } from "@/components/brand/BrandsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 300;

const description = `${BRAND.name} дээрх бүх брэндүүд. Дэлхийн шилдэг брэндийн бүтээгдэхүүнүүдийг худалдаж аваарай.`;
const title = `Брэндүүд | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Брэндүүд",
  description,
  alternates: {
    canonical: "/brands",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/brands`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
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
