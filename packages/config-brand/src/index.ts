// Single source of truth for brand identity and locale constants.
// Shared between @monpang/frontend and @monpang/admin.
//
// For a more comprehensive customization surface (contact info, social links,
// payments, delivery zones, legal jurisdiction, feature flags), see
// @repo/config-site, which composes this package.

const baseName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Monpang";
const shortName = process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? baseName;

export const BRAND = {
  name: baseName,
  shortName,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://monpang.com",
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://monpang-admin.vercel.app",
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
  ogImage: "/og-image.png",
  twitterCard: "summary_large_image",
  authorName: baseName,
  adminTitle: `${baseName} Admin`,
  adminPanelTitle: `${baseName} Admin Panel`,
  keywords: [
    "онлайн дэлгүүр",
    "e-commerce",
    "монгол",
    "худалдаа",
    "бараа",
    "гоо сайхан",
    "хувцас",
    "электроник",
  ],
} as const;

export const LOCALE = {
  code: "mn-MN",
  ogLocale: "mn_MN",
  currency: "MNT",
  currencySymbol: "₮",
  timezone: "Asia/Ulaanbaatar",
  phoneCountryCode: "976",
  phoneRegex: /^\+?976/,
} as const;

export const DELIVERY_ZONES_CONFIG = {
  capital: "Улаанбаатар",
  rural: "Орон нутаг",
} as const;

export type Brand = typeof BRAND;
export type Locale = typeof LOCALE;
export type DeliveryZonesConfig = typeof DELIVERY_ZONES_CONFIG;
