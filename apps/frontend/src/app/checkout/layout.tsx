import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Төлбөр төлөх",
  description: "Захиалгаа баталгаажуулж, төлбөрөө төлнө үү.",
  alternates: { canonical: "/checkout" },
  // Checkout pages handle PII and shouldn't be indexed even if robots.txt
  // is misconfigured. Defense in depth.
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
