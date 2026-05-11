import { Metadata } from "next";
import { ArticlesClient } from "@/components/articles/ArticlesClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 300;

const description = `${BRAND.name}-ийн нийтлэлүүд, зөвлөмж болон мэдээлэл. Бараа солих, захиалга хийх заавар, танилцуулга.`;
const title = `Нийтлэл | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Нийтлэл",
  description,
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/articles`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function ArticlesPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Нийтлэл", url: "/articles" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticlesClient />
    </>
  );
}
