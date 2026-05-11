// Mirrors frontend/src/lib/utils/brand-config.ts. Admin uses a subset —
// no OG/Twitter metadata needed.

const baseName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Monpang";

export const BRAND = {
  name: baseName,
  adminTitle: `${baseName} Admin`,
  adminPanelTitle: `${baseName} Admin Panel`,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://monpang.com",
} as const;

export const LOCALE = {
  code: "mn-MN",
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
