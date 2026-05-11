import { Metadata } from "next";
import { BestSellersClient } from "@/components/best-sellers/BestSellersClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 60;

const description = `${BRAND.name} дээр хамгийн их борлуулагдаж буй бүтээгдэхүүнүүд. Хэрэглэгчдийн сонголт, шилдэг бараанууд.`;
const title = `Хамгийн их борлуулагдсан | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Хамгийн их борлуулагдсан",
  description,
  alternates: {
    canonical: "/best-sellers",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/best-sellers`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function BestSellersPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Хамгийн их борлуулагдсан", url: "/best-sellers" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <BestSellersClient />
    </>
  );
}
