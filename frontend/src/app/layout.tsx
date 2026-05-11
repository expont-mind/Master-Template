import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { LoginModal } from "@/components/auth/LoginModal";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { PendingInvoiceRecovery } from "@/components/providers/PendingInvoiceRecovery";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WishlistSyncProvider } from "@/components/providers/WishlistSyncProvider";
import { CartSyncProvider } from "@/components/providers/CartSyncProvider";
import { ScrollRestoration } from "@/components/providers/ScrollRestoration";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastContainer } from "@/components/ui/Toast";
import {
  OrganizationSchema,
  SiteNavigationSchema,
} from "@/components/seo/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";
import NextTopLoader from "nextjs-toploader";

const manrope = Roboto_Flex({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://monpang.com"),
  title: {
    default: "Monpang - Монголын онлайн дэлгүүр",
    template: "%s | Monpang",
  },
  description:
    "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
  keywords: [
    "онлайн дэлгүүр",
    "e-commerce",
    "монгол",
    "худалдаа",
    "бараа",
    "monpang",
    "монпанг",
    "гоо сайхан",
    "хувцас",
    "электроник",
  ],
  authors: [{ name: "Monpang" }],
  creator: "Monpang",
  publisher: "Monpang",
  alternates: {
    canonical: "/",
    languages: {
      "mn-MN": "https://monpang.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "https://monpang.com",
    siteName: "Monpang",
    title: "Monpang - Монголын онлайн дэлгүүр",
    description:
      "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monpang - Монголын онлайн дэлгүүр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monpang - Монголын онлайн дэлгүүр",
    description:
      "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className={manrope.variable}>
      <body className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
        <NextTopLoader color="#020617" height={2} showSpinner={false} />
        <ScrollRestoration />
        <OrganizationSchema />
        <SiteNavigationSchema />
        <QueryProvider>
          <WishlistSyncProvider>
            <CartSyncProvider>
              <Header />
              <MobileNav />
              <LoginModal />
              <AuthErrorHandler />
              <PendingInvoiceRecovery />
              <ToastContainer />
              <ErrorBoundary
                fallback={
                  <main className="flex-1 flex items-center justify-center py-20">
                    <p className="text-text-secondary text-sm">
                      Алдаа гарлаа. Хуудсаа дахин ачааллана уу.
                    </p>
                  </main>
                }
              >
                <main className="flex-1">{children}</main>
              </ErrorBoundary>
              <Footer />
            </CartSyncProvider>
          </WishlistSyncProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
