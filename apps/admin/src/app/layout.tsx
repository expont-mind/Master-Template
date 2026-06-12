import { Roboto_Flex } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/utils/brand-config";

import type { Metadata } from "next";
import "./globals.css";

const robotoFlex = Roboto_Flex({
  subsets: ["latin", "cyrillic"],
  variable: "--font-roboto-flex",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.adminTitle,
  description: BRAND.adminPanelTitle,
  icons: {
    icon: "/monpang-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={robotoFlex.variable}>
      <head>
        {/* Warm the Google Fonts CDN connection so Roboto Flex lands
            faster on first paint. `next/font` already fetches from
            fonts.googleapis.com; preconnect cuts TLS setup latency. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <NextTopLoader color="#ef4444" height={2} showSpinner={false} />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
