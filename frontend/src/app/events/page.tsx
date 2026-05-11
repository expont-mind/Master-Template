import { Metadata } from "next";
import { EventsClient } from "@/components/events/EventsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

export const revalidate = 300;

const description = `${BRAND.name}-ийн эвэнтүүд, урамшуулал болон тусгай үйл явдлууд. Шинэ мэдээлэл, хямдрал, тусгай санал.`;
const title = `Эвэнт | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Эвэнт",
  description,
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/events`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function EventsPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Эвэнт", url: "/events" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <EventsClient />
    </>
  );
}
