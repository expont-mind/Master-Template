import { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

import { TermsSectionsFirst } from "./_sections/TermsSectionsFirst";
import { TermsSectionsSecond } from "./_sections/TermsSectionsSecond";

const description = `${BRAND.name}-н үйлчилгээний нөхцөл. Вэбсайт болон үйлчилгээг ашиглах дүрэм, журам.`;
const title = `Үйлчилгээний нөхцөл | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл",
  description,
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/terms-of-service`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function TermsOfServicePage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Үйлчилгээний нөхцөл", url: "/terms-of-service" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
          <div className="flex flex-col gap-8 md:gap-12">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-text-primary font-bold text-2xl md:text-[28px] lg:text-[32px] leading-8 md:leading-10 font-manrope">
                Үйлчилгээний нөхцөл
              </h1>
              <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">
                Сүүлд шинэчлэгдсэн: 2025 оны 1-р сарын 12
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-8 md:gap-10">
              <TermsSectionsFirst />
              <TermsSectionsSecond />
            </div>

            {/* Footer links */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="text-text-primary font-medium text-sm md:text-base font-manrope underline hover:text-text-secondary transition-colors duration-200"
              >
                ← Нүүр хуудас руу буцах
              </Link>
              <Link
                href="/privacy-policy"
                className="text-text-secondary font-medium text-sm md:text-base font-manrope underline hover:text-text-primary transition-colors duration-200"
              >
                Нууцлалын бодлого
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
