import { Metadata } from "next";
import { NewArrivalsClient } from "@/components/new-arrivals/NewArrivalsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Шинээр нэмэгдсэн",
  description:
    "Monpang дээр шинээр нэмэгдсэн бүтээгдэхүүнүүд. Хамгийн сүүлийн үеийн бараанууд.",
  alternates: {
    canonical: "/new-arrivals",
  },
  openGraph: {
    title: "Шинээр нэмэгдсэн | Monpang",
    description:
      "Monpang дээр шинээр нэмэгдсэн бүтээгдэхүүнүүд. Хамгийн сүүлийн үеийн бараанууд.",
    url: "https://monpang.com/new-arrivals",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Шинээр нэмэгдсэн | Monpang",
    description:
      "Monpang дээр шинээр нэмэгдсэн бүтээгдэхүүнүүд. Хамгийн сүүлийн үеийн бараанууд.",
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
