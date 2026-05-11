import { Metadata } from "next";
import { BRAND } from "@/lib/utils/brand-config";

const description = `${BRAND.name} дээрх бүртгэл болон хувийн мэдээллээ устгуулах хүсэлт гаргах.`;
const title = `Өгөгдөл устгах хүсэлт | ${BRAND.name}`;

export const metadata: Metadata = {
  title: "Өгөгдөл устгах хүсэлт",
  description,
  alternates: {
    canonical: "/data-deletion",
  },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/data-deletion`,
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
