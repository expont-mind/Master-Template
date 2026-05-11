import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FAQClient } from "@/components/faq/FAQClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";
import { log } from "@/lib/utils/logger";

const description =
  "Бүртгэл, захиалга, хүргэлт, төлбөрийн түгээмэл асуултын хариултуудыг эндээс үзнэ үү.";
const title = `Түгээмэл асуултууд | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Түгээмэл асуултууд",
  description,
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/faq`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default async function FAQPage() {
  const supabase = await createClient();

  const { data: faqs, error } = await supabase.from("faqs").select("*");

  if (error) {
    log.error("faq_query_error", { message: error?.message ?? String(error) });
  }

  const faqsArray = Array.isArray(faqs) ? faqs : [];

  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Түгээмэл асуултууд", url: "/faq" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQClient faqs={faqsArray} />
    </>
  );
}
