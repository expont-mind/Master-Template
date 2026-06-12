import { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/utils/brand-config";

import {
  ChildrenPrivacySection,
  CollectedDataSection,
  ContactSection,
  CookiesSection,
  DataSharingSection,
  DataUsageSection,
  IntroSection,
  PolicyChangesSection,
  SecuritySection,
  ThirdPartySection,
  UserRightsSection,
} from "./_PrivacySections";

const description = `${BRAND.name}-н нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хадгалж, ашигладаг талаар.`;
const title = `Нууцлалын бодлого | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Нууцлалын бодлого",
  description,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/privacy-policy`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const breadcrumbItems = [
  { name: "Нүүр", url: "/" },
  { name: "Нууцлалын бодлого", url: "/privacy-policy" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
          <div className="flex flex-col gap-8 md:gap-12">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-text-primary font-bold text-2xl md:text-[28px] lg:text-[32px] leading-8 md:leading-10 font-manrope">
                Нууцлалын бодлого
              </h1>
              <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">
                Сүүлд шинэчлэгдсэн: 2025 оны 1-р сарын 12
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-8 md:gap-10">
              <IntroSection />
              <CollectedDataSection />
              <DataUsageSection />
              <DataSharingSection />
              <SecuritySection />
              <CookiesSection />
              <UserRightsSection />
              <ThirdPartySection />
              <ChildrenPrivacySection />
              <PolicyChangesSection />
              <ContactSection />
            </div>

            {/* Footer link */}
            <div className="pt-6 border-t border-border">
              <Link
                href="/"
                className="text-text-primary font-medium text-sm md:text-base font-manrope underline hover:text-text-secondary transition-colors duration-200"
              >
                ← Нүүр хуудас руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
