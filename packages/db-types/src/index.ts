// Supabase database types. Regenerate with `pnpm -F @repo/db-types gen`.
// Both @monpang/frontend and @monpang/admin must import from here — do not
// maintain per-app copies.
//
// Re-exports everything from ./database (the generated file) plus convenience
// domain aliases that apps used to declare locally.

export * from "./database";

import type {
  Database,
  Tables,
  Insertable,
  Updatable,
  OrderStatus as DbOrderStatus,
  PaymentStatus as DbPaymentStatus,
} from "./database";

// Domain row aliases. Add new aliases here when a table becomes widely used
// across app code so call sites don't repeat `Database["public"]["Tables"]...`.
export type Product = Tables<"products">;
export type Category = Tables<"categories">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Profile = Tables<"profiles">;
export type Review = Tables<"reviews">;
export type Notification = Tables<"notifications">;
export type OrderStatusHistory = Tables<"order_status_history">;
export type SocialLink = Tables<"social_links">;
export type FAQ = Tables<"faqs">;
export type Event = Tables<"events">;
export type Branch = Tables<"branches">;
export type Article = Tables<"articles">;
export type DeliveryZone = Tables<"delivery_zones">;

// Insertable variants for forms / mutations.
export type ProductInsert = Insertable<"products">;
export type CategoryInsert = Insertable<"categories">;
export type OrderInsert = Insertable<"orders">;

// StatusType — frontend-only union used in order status timelines.
// Keeping the previous locally-defined alias to preserve call sites.
export type StatusType = "order" | "delivery" | "payment";

// Re-exported with their original names for compatibility with older imports.
export type { DbOrderStatus as OrderStatusEnum, DbPaymentStatus as PaymentStatusEnum };
