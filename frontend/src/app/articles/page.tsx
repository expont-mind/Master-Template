import { Metadata } from "next";
import { ArticlesClient } from "@/components/articles/ArticlesClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Нийтлэл",
  description:
    "Monpang-ийн нийтлэлүүд, зөвлөмж болон мэдээлэл. Бараа солих, захиалга хийх заавар, танилцуулга.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title: "Нийтлэл | Monpang",
    description:
      "Monpang-ийн нийтлэлүүд, зөвлөмж болон мэдээлэл. Бараа солих, захиалга хийх заавар, танилцуулга.",
    url: "https://monpang.com/articles",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Нийтлэл | Monpang",
    description:
      "Monpang-ийн нийтлэлүүд, зөвлөмж болон мэдээлэл. Бараа солих, захиалга хийх заавар, танилцуулга.",
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
