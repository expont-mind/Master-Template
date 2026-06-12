import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Хадгалсан",
  description: "Дараа худалдаж авахаар тэмдэглэсэн бүтээгдэхүүнүүдээ нэгээр харах.",
  alternates: { canonical: "/wishlist" },
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
