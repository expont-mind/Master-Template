import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сагс",
  description:
    "Сонгосон бүтээгдэхүүнээ сагсанд үзэж, тоо ширхэг, хуваарилалтыг шалгана уу.",
  alternates: { canonical: "/cart" },
  // Cart contents are personal and shouldn't appear in search results.
  robots: { index: false, follow: false },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
