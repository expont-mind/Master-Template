// Single source of truth for brand identity and locale constants.
// frontend/CLAUDE.md declares this file as the canonical location for
// brand-specific strings — do not hardcode them elsewhere.

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Monpang",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? "Monpang",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://monpang.com",
  description:
    "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
  ogImage: "/og-image.png",
  twitterCard: "summary_large_image",
  authorName: "Monpang",
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
