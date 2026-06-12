import { Metadata } from "next";

import { NewArrivalsClient } from "@/components/new-arrivals/NewArrivalsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 60;

const description = `${BRAND.name} дээр шинээр нэмэгдсэн бүтээгдэхүүнүүд. Хамгийн сүүлийн үеийн бараанууд.`;
const title = `Шинээр нэмэгдсэн | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Шинээр нэмэгдсэн",
  description,
  alternates: {
    canonical: "/new-arrivals",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/new-arrivals`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function NewArrivalsPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Шинээр нэмэгдсэн", url: "/new-arrivals" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <NewArrivalsClient />
    </>
  );
}
