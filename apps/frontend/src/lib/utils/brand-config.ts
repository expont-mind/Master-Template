// Re-export shim. The canonical source is now @repo/config-brand.
// Phase 1 keeps this shim so existing imports (~191 sites) continue to work.
// Phase 5 cleanup will rewrite imports to use @repo/config-brand directly and
// delete this file.
export { BRAND, LOCALE, DELIVERY_ZONES_CONFIG } from "@repo/config-brand";
export type { Brand, Locale, DeliveryZonesConfig } from "@repo/config-brand";
