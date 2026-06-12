// Single source of truth for client-customizable site configuration.
//
// When duplicating this template for a new client, this is the FIRST file to
// edit. All values fall back to env vars where it makes sense so that the
// same code can be redeployed for a different brand without touching source.
//
// AI agent rule: when asked to "rebrand for client X", update this file +
// packages/theme + the public/ logo assets. Do NOT touch business logic.

import { BRAND, LOCALE, DELIVERY_ZONES_CONFIG } from "@repo/config-brand";

/** Customer login channel. Drives LoginModal, the wishlist gate, and
 *  profile phone verification. */
export type AuthMethod = "phone" | "email";

export const SITE = {
  // Brand identity (re-exported from @repo/config-brand so all imports converge).
  brand: BRAND,

  // Locale, currency, and phone formatting rules.
  locale: LOCALE,

  // Public contact information shown in Footer, legal pages, and admin defaults.
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+976 7771-0900",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@monpang.com",
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@monpang.com",
    address:
      process.env.NEXT_PUBLIC_CONTACT_ADDRESS ??
      "Монгол Улс, Улаанбаатар хот, СБД, 3-р хороо, 5-р хороолол, Усны гудамж, Санто таур 4 давхар, 405 тоот",
  },

  // Social links — null means "do not render". Customize per client.
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "monpang.mn",
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? null,
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? null,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? null,
  },

  // Delivery configuration — zone names are display labels, not slugs.
  delivery: {
    zones: DELIVERY_ZONES_CONFIG,
    freeShippingThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? 50000),
  },

  // Payment provider toggles. Set to false to hide a provider from checkout.
  // Backing env vars (QUICKPAY_*, LENDMN_*, STOREPAY_*) must still be set when
  // a provider is enabled.
  payments: {
    qpay: process.env.NEXT_PUBLIC_PAYMENT_QPAY !== "false",
    lendmn: process.env.NEXT_PUBLIC_PAYMENT_LENDMN !== "false",
    storepay: process.env.NEXT_PUBLIC_PAYMENT_STOREPAY !== "false",
    transfer: process.env.NEXT_PUBLIC_PAYMENT_TRANSFER !== "false",
  },

  // Feature flags. Toggle off to hide entire surfaces from the customer UI.
  // Convention: the feature's ENTRY component self-gates
  // (`if (!SITE.features.X) return null;` before any hook runs) so call
  // sites never need their own guards.
  features: {
    reviews: process.env.NEXT_PUBLIC_FEATURE_REVIEWS !== "false",
    wishlist: process.env.NEXT_PUBLIC_FEATURE_WISHLIST !== "false",
    coupons: process.env.NEXT_PUBLIC_FEATURE_COUPONS !== "false",
    articles: process.env.NEXT_PUBLIC_FEATURE_ARTICLES !== "false",
    events: process.env.NEXT_PUBLIC_FEATURE_EVENTS !== "false",
    pointSystem: process.env.NEXT_PUBLIC_FEATURE_POINTS !== "false",
    notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS !== "false",
  },

  // Customer auth channel. `phone` requires an SMS provider configured in
  // the client's Supabase project; `email` works out of the box.
  auth: {
    method: (process.env.NEXT_PUBLIC_AUTH_METHOD as AuthMethod) ?? "phone",
  },

  // Legal information used by /privacy-policy and /terms-of-service pages.
  legal: {
    jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION ?? "Mongolia",
    jurisdictionMn: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION_MN ?? "Монгол Улс",
    privacyEmail: process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ?? "info@monpang.com",
    companyRegistration: process.env.NEXT_PUBLIC_COMPANY_REGISTRATION ?? null,
  },

  // SEO / metadata defaults. Overridden per page when needed.
  seo: {
    googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? null,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? null,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? null,
  },
} as const;

export type Site = typeof SITE;
