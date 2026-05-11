import { Metadata } from "next";
import { EventsClient } from "@/components/events/EventsClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Эвэнт",
  description:
    "Monpang-ийн эвэнтүүд, урамшуулал болон тусгай үйл явдлууд. Шинэ мэдээлэл, хямдрал, тусгай санал.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Эвэнт | Monpang",
    description:
      "Monpang-ийн эвэнтүүд, урамшуулал болон тусгай үйл явдлууд. Шинэ мэдээлэл, хямдрал, тусгай санал.",
    url: "https://monpang.com/events",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Эвэнт | Monpang",
    description:
      "Monpang-ийн эвэнтүүд, урамшуулал болон тусгай үйл явдлууд. Шинэ мэдээлэл, хямдрал, тусгай санал.",
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
