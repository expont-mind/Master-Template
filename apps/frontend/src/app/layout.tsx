import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import { Roboto_Flex } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { LoginModal } from "@/components/auth/LoginModal";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { CartSyncProvider } from "@/components/providers/CartSyncProvider";
import { PendingInvoiceRecovery } from "@/components/providers/PendingInvoiceRecovery";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ScrollRestoration } from "@/components/providers/ScrollRestoration";
import { WishlistSyncProvider } from "@/components/providers/WishlistSyncProvider";
import { OrganizationSchema, SiteNavigationSchema } from "@/components/seo/JsonLd";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastContainer } from "@/components/ui/Toast";
import { BRAND, LOCALE } from "@/lib/utils/brand-config";

import type { Metadata } from "next";

const manrope = Roboto_Flex({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const siteTitle = `${BRAND.name} - Монголын онлайн дэлгүүр`;

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: siteTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [...BRAND.keywords],
  authors: [{ name: BRAND.authorName }],
  creator: BRAND.authorName,
  publisher: BRAND.authorName,
  alternates: {
    canonical: "/",
    languages: {
      [LOCALE.code]: BRAND.url,
    },
  },
  openGraph: {
    type: "website",
    locale: LOCALE.ogLocale,
    url: BRAND.url,
    siteName: BRAND.name,
    title: siteTitle,
    description: BRAND.description,
    images: [
      {
        url: BRAND.ogImage,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: BRAND.twitterCard,
    title: siteTitle,
    description: BRAND.description,
    images: [BRAND.ogImage],
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
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <NextTopLoader color="var(--color-text-primary)" height={2} showSpinner={false} />
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
