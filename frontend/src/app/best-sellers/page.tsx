import { Metadata } from "next";
import { BestSellersClient } from "@/components/best-sellers/BestSellersClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Хамгийн их борлуулагдсан",
  description:
    "Monpang дээр хамгийн их борлуулагдаж буй бүтээгдэхүүнүүд. Хэрэглэгчдийн сонголт, шилдэг бараанууд.",
  alternates: {
    canonical: "/best-sellers",
  },
  openGraph: {
    title: "Хамгийн их борлуулагдсан | Monpang",
    description:
      "Monpang дээр хамгийн их борлуулагдаж буй бүтээгдэхүүнүүд. Хэрэглэгчдийн сонголт, шилдэг бараанууд.",
    url: "https://monpang.com/best-sellers",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Хамгийн их борлуулагдсан | Monpang",
    description:
      "Monpang дээр хамгийн их борлуулагдаж буй бүтээгдэхүүнүүд. Хэрэглэгчдийн сонголт, шилдэг бараанууд.",
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
