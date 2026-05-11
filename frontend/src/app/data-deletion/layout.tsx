import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Өгөгдөл устгах хүсэлт",
  description:
    "Monpang дээрх бүртгэл болон хувийн мэдээллээ устгуулах хүсэлт гаргах.",
  alternates: {
    canonical: "/data-deletion",
  },
  openGraph: {
    title: "Өгөгдөл устгах хүсэлт | Monpang",
    description:
      "Monpang дээрх бүртгэл болон хувийн мэдээллээ устгуулах хүсэлт гаргах.",
    url: "https://monpang.com/data-deletion",
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
