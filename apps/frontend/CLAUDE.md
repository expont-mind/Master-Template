# Frontend - Project Conventions

## Tech Stack

- **Framework**: Next.js 16 (App Router, `src/app/`)
- **React**: 19
- **Data Fetching**: TanStack Query v5 (client-side), Supabase (server-side)
- **State Management**: Zustand v5 (local/UI state)
- **Styling**: Tailwind CSS v4, CSS variables for theming
- **Database**: Supabase (PostgreSQL) - browser + server clients
- **Caching**: Upstash Redis (server-side SWR pattern)
- **Icons**: Lucide React + custom SVG components
- **Font**: Manrope (Latin + Cyrillic via `--font-manrope`)
- **Language**: TypeScript (strict mode)
- **UI Language**: Mongolian

## Architecture

### Data Fetching Strategy

**Server Components** (default): Direct Supabase queries for initial page data.

```tsx
// app/page.tsx (server component)
const supabase = await createClient(); // server client
const { data } = await supabase.from("products").select("*");
```

**Client Components** with TanStack Query: For interactive data with caching.

```tsx
// hooks/useProducts.ts
const { data, isLoading } = useQuery({
  queryKey: productKeys.lists(filters),
  queryFn: () => getProducts(filters),
});
```

**Hybrid** (SSR + Client hydration): Prefetch on server, hydrate on client.

```tsx
// app/products/[slug]/page.tsx (server)
const queryClient = new QueryClient();
await queryClient.prefetchQuery({ queryKey, queryFn });
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <Client />
  </HydrationBoundary>
);
```

### Query Key Factory

```ts
productKeys.all; // ["products"]
productKeys.lists(filters); // ["products", "list", filters]
productKeys.detail(slug); // ["products", "detail", slug]
productKeys.categories; // ["categories"]
```

### Zustand Stores

- `cart-store.ts` - Cart items, persisted to localStorage
- `wishlist-store.ts` - Wishlist items, persisted to localStorage
- `ui-store.ts` - Modals, drawers, toasts (not persisted)

### Supabase Clients

- `lib/supabase/client.ts` - Browser client (anon key)
- `lib/supabase/server.ts` - Server client (cookie-based session)
- `lib/supabase/admin.ts` - Service role client (server-only)

### Redis Caching

- `lib/redis/client.ts` - SWR pattern with `getCachedOrFetch()`
- TTLs defined in `lib/utils/constants.ts` (`CACHE_TTL`)

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Home (server component)
│   ├── products/(list)/page.tsx  # Product listing (route group serves /products)
│   ├── products/[slug]/      # Product detail (hybrid SSR)
│   ├── search/               # Search results
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Checkout flow
│   └── profile/              # User profile
├── components/
│   ├── product/              # ProductCard, ProductInfo, ProductVariants, etc.
│   ├── layout/               # Header, Footer, MobileNav, Breadcrumbs
│   ├── home/                 # Homepage sections
│   ├── cart/                 # Cart modals/sheets (VariantEditSheet, CouponSelectModal, ...)
│   ├── auth/                 # LoginModal
│   ├── search/               # Search components
│   ├── providers/            # QueryProvider
│   ├── svg/                  # Custom SVG icon components
│   └── ui/                   # Reusable UI (Button, Card, Modal, etc.)
├── lib/
│   ├── queries/              # Query functions + key factories
│   ├── hooks/                # TanStack Query hooks + custom hooks
│   ├── supabase/             # Supabase clients
│   ├── redis/                # Redis caching
│   └── utils/                # Constants, formatters, cn()
├── stores/                   # Zustand stores
└── types/                    # Database types, product types, order types
```

## Conventions

- **Server components** are the default. Add `"use client"` only when needed.
- **No `transition-all` in layout chrome** (`components/layout/**`) — it interpolates background/color during theme changes. List properties explicitly: `transition-colors` for hover states, `transition-[max-height,opacity]` for reveals (see `Header.tsx`, `HeaderCategoryDropdown.tsx`). ESLint enforces this.
- **Links via `ROUTES`** — never hand-build `/products/${...}` or `/products?category=${...}`; use `ROUTES.PRODUCT(slug)` / `ROUTES.CATEGORY(slug)` from `lib/utils/constants.ts`. ESLint enforces this. UUID ids resolve on the `[slug]` route by design (`_productBySlugQueries` checks `isUuid`), so `slug ?? id` fallbacks are legal _inside_ `ROUTES.PRODUCT(...)`.
- **No raw-hex Tailwind classes** — use the semantic tokens from `@repo/theme` (`text-text-primary`, `bg-brand-primary`, `bg-overlay`, ...). ESLint enforces this.
- **ProductCard** supports 3 variants: `default`, `small`, `horizontal`
- **Formatters** in `lib/utils/formatters.ts`: `formatPrice()`, `getDiscountPercentage()`, `formatDate()`
- **Constants** in `lib/utils/constants.ts`: `DEFAULT_PAGE_SIZE=24`, `CACHE_TTL`, `SORT_OPTIONS`, `ROUTES`
- **CSS variables** for theming: `--color-text-primary`, `--color-border`, `--color-surface`, etc.
- **Responsive**: Mobile-first, breakpoints at `sm`, `md`, `lg`, `xl`
- **Image handling**: Next.js `Image` component with `sizes` prop
- **Error boundaries**: `ErrorBoundary` wraps main content in root layout
- **Loading states**: Skeleton placeholders with `animate-pulse`

## Frontend Architecture & Logic Documentation

### Project Architecture Overview

**Monorepo layout**: `frontend/` (Next.js web), `admin/` (admin dashboard), `mobile/` (Flutter/Dart). All share the same Supabase PostgreSQL backend and business entities.

**Rendering modes by route**:
| Route | Mode | Revalidation |
|---|---|---|
| `/` (home) | Server Component | ISR 60s |
| `/products` | SSR + client filters | — |
| `/products/[slug]` | Hybrid (SSR prefetch + client hydration) | ISR 300s |
| `/search` | SSR + client | — |
| `/cart`, `/checkout`, `/wishlist` | Client only | — |
| `/profile` | Client only (protected) | — |
| `/brands`, `/articles`, `/events` | SSR | ISR 300s |
| `/best-sellers`, `/new-arrivals` | SSR | ISR 300s |

**Three data layers (top → bottom)**:

1. **Server Components** — direct Supabase queries for initial page data
2. **TanStack Query v5** — client-side caching with `useQuery`/`useInfiniteQuery`, query key factories, stale times
3. **Zustand v5** — local-first state for cart, wishlist, UI (modals/toasts)

### Commerce Flow (Browse → Cart → Checkout → Order)

#### 1. Product Browsing

**Listing** (`lib/queries/products.ts` → `getProducts()`):

- Filters: category (hierarchical with descendant walk), minPrice, maxPrice, inStock, sort, search text
- Category filtering: fetches category by slug → recursively collects all child category IDs → queries `product_categories` junction table → deduplicates product IDs
- Price filtering: checks both `discount_price` (if > 0) and `price` via Supabase `.or()` with multiple AND conditions
- Sort: `newest` (created_at desc), `popular` (stock_quantity), `price_asc`, `price_desc`
- Pagination: offset + limit model with `hasMore` flag, `DEFAULT_PAGE_SIZE=24`, `PRODUCTS_PER_LOAD=12`
- Data assembly: batch-loads images in chunks of 50 (avoids URL length limits), fetches default variants for display pricing, falls back to variant images when product has none

**Detail** (`lib/queries/products.ts` → `getProductBySlug()`):

- Parallel fetches: product, product_details (specs), variants (active only, ordered by is_default), images (product-level + variant-level), rich descriptions, brand, category path
- Builds hierarchical category breadcrumb from root to leaf via `product_categories` associations

**Search** (`lib/queries/search.ts`):

- `getSearchSuggestions(query)`: returns typed suggestions (product/category/query)
- `searchProducts(query, filters)`: full-text search with filters
- `getTrendingSearches(days, limit, minCount)`: from `search_logs` table
- Recent searches stored in localStorage via `useRecentSearches` hook
- Debounced input: `SEARCH_DEBOUNCE_MS=300`

#### 2. Cart

**Store**: `stores/cart-store.ts` (Zustand with localStorage persistence, key: `cart-storage`)

**Item identity**: `product.id` + `variant?.id` — two items with different variants are separate entries.

**Item ID format**: `"{productId}-{variantId|'default'}-{timestamp}"` — unique client-side key.

**Core operations**:

- `addItem(product, qty, variant)`: if same product+variant exists, increment quantity; otherwise create new entry. Syncs to server via `addToServerCart()`.
- `removeItem(itemId)`: filter by client ID. Syncs via `removeFromServerCart()`.
- `updateQuantity(itemId, qty)`: clamps to `Math.max(1, qty)`. Syncs via `updateServerCartQuantity()`.
- `updateVariant(itemId, newVariant)`: checks for duplicate (another cart item with same product + new variant). If found, merges quantities. Otherwise updates in-place. Server sync: removes old variant entry, adds new one.
- `clearCart()`: wipes items + selectedCoupon. Syncs via `clearServerCart()`.

**Server synchronization**:

- All mutations are fire-and-forget: `.catch(() => {})` — UI never blocks on server write failures.
- Server tables: `cart_items(user_id, product_id, variant_id, quantity)` with partial unique index handling NULL variant_id.
- `loadFromServer(items)`: skips overwrite if server returns empty but local has items (prevents race condition on failed fetch).
- `CartSyncProvider` (`components/providers/CartSyncProvider.tsx`): on auth state change, sets userId, loads server cart, syncs local→server.

**Computed**:

- `getSubtotal()`: sum of `(variant.discount_price ?? variant.price ?? product.discount_price ?? product.price) × quantity`
- `getItemCount()`: sum of all quantities

#### 3. Checkout

**Page**: `app/checkout/page.tsx` (client component)

**Pre-checkout validation**:

- `validateCartItems()`: server action checking all product IDs are still active
- `canPay` gate: items > 0, no cart warning, address valid, contact filled (lastName, firstName, phone1)

**Three-phase payment flow**:

**Phase 1 — Invoice creation** (`components/checkout/actions.ts`):

- `createCheckoutInvoice()` for QPay / `createLendMNCheckoutInvoice()` for LendMN
- Server validates: auth, non-empty cart, address fields, stock + variant requirements
- Creates in order: (1) `orders` row (pending/unpaid) → (2) `order_items` rows → (3) payment provider invoice → (4) `payment_invoices` row linked to order
- On item insertion failure: cleans up the orphan order
- On invoice creation failure: cleans up the orphan order
- Returns invoice data (QR code, payment URLs) + orderNumber + orderId

**Phase 2 — Payment**:

- QPay: QR code displayed in `PaymentModal`, user pays via banking app, QPay sends callback to `/api/checkout/callback`
- LendMN: installment payment via phone, callback to `/api/checkout/lendmn-callback`
- `checkPaymentStatus(invoiceId, provider)`: checks DB first (callback may have updated), then falls back to provider API. Updates DB on confirmed payment.

**Phase 3 — Order confirmation** (`createOrderAfterPayment()`):

- Idempotent: if order already confirmed+paid, returns success immediately
- Calls Supabase RPC `create_order_from_invoice(p_invoice_id)` which: decrements stock, sets order status=confirmed, payment_status=paid
- Records coupon usage if applicable (validates global + per-user limits)
- `recoverPendingInvoices()`: background scan for invoices 1min–2hrs old without order_id, checks payment status, creates orders for confirmed payments

#### 4. Payment Providers

**QPay** (`lib/qpay/client.ts`):

- REST API: `createInvoice()`, `checkPayment()`
- Auth: Bearer token + X-QPay-Merchant-Id header
- Env vars: `QUICKPAY_API_URL`, `QUICKPAY_API_KEY`, `QUICKPAY_MERCHANT_ID`, `QUICKPAY_ACCOUNT_NUMBER`
- `resolvePaymentWallet()` (`lib/qpay/utils.ts`): extracts wallet name from payment response

**LendMN** (`lib/lendmn/client.ts`):

- OAuth2 client credentials flow with module-level token cache (persists across warm invocations)
- `createLendMNInvoice()`, `getLendMNInvoiceStatus()`
- Token refresh: cached until `Date.now() < tokenExpiresAt`

**Payment callbacks** (API routes):

- `/api/checkout/callback/route.ts`: QPay webhook → RPC `create_order_from_invoice`
- `/api/checkout/lendmn-callback/route.ts`: LendMN webhook

### Pricing & Discount Logic

**Pricing hierarchy** (highest priority wins):

1. `variant.discount_price` (if variant selected and discount > 0 and < variant.price)
2. `variant.price` (if variant selected)
3. `product.discount_price` (if discount > 0 and < product.price)
4. `product.price` (base)

**Discount percentage**: `Math.round(((original - discount) / original) * 100)` — via `getDiscountPercentage()` in `lib/utils/formatters.ts`

**Coupon system** (calculated in `app/checkout/page.tsx`):

- Stored in `useCartStore.selectedCoupon`
- **Scope types**: `null`/`"all"` (entire cart), `"product"` (specific product IDs), `"category"` (via `product_categories` junction), `"brand"` (via `product.brand_id`)
- **Coupon types**:
  - `"percentage"`: `discount = Math.min(applicableSubtotal × (value/100), max_discount_amount)`, capped at applicableSubtotal
  - `"fixed"`: applied per unit to highest-priced matching items (sorted desc), up to `max_applicable_qty`
  - `"free_shipping"`: `Math.min(discount_value, deliveryFee)`
- **Scoped calculation**: filters cart items by scope → collects individual unit prices → sorts descending → takes up to `max_applicable_qty` units → calculates discount on that subset
- **Usage limits**: `recordCouponUsage()` validates `usage_limit` (global) and `usage_limit_per_user` before recording

**Delivery fee** (zone-based):

- Two zones: `"Улаанбаатар"` (UB) and `"Орон нутаг"` (regional) from `delivery_zones` table
- Free delivery: if `is_free_delivery_enabled` and `afterProductDiscount >= free_delivery_threshold`
- Otherwise: `activeZone.delivery_fee`

**Total formula**:

```
totalPayable = (subtotal - productDiscount) + deliveryFee - couponDiscount
```

### State Management Pattern

**Zustand stores** (`stores/`):

| Store               | Persisted                             | Key                    | What's stored                                 |
| ------------------- | ------------------------------------- | ---------------------- | --------------------------------------------- |
| `cart-store.ts`     | Yes (localStorage `cart-storage`)     | items + selectedCoupon | Cart items, coupon selection                  |
| `wishlist-store.ts` | Yes (localStorage `wishlist-storage`) | items                  | Wishlisted products                           |
| `ui-store.ts`       | No                                    | —                      | Modal/drawer/toast states, login redirect URL |

**TanStack Query** (`lib/hooks/`, `lib/queries/`):

- Query key factory pattern: `productKeys.all`, `.lists(filters)`, `.detail(slug)`, `.categories`
- Stale times: products list 60s, product detail 30s, categories 3600s
- `useInfiniteQuery` for paginated product lists
- Hooks: `useProducts`, `useProductDetail`, `useCategories`, `useBrands`, `useReviews`, `useSearchProducts`, `useSearchSuggestions`, `useNotifications`, `useCheckout`, `useDefaultAddress`

**Providers** (`components/providers/`):

- `QueryProvider.tsx`: TanStack Query client setup
- `CartSyncProvider.tsx`: syncs Zustand cart ↔ server cart on auth change
- `WishlistSyncProvider.tsx`: syncs Zustand wishlist ↔ server wishlist on auth change
- `PendingInvoiceRecovery.tsx`: runs `recoverPendingInvoices()` on mount for returning users
- `ScrollRestoration.tsx`: manages scroll position

### API Integration Pattern

**Supabase** (primary data layer):

- `lib/supabase/client.ts` — browser client (anon key, cookie-based auth)
- `lib/supabase/server.ts` — server component client (cookie-based session)
- `lib/supabase/admin.ts` — service role client (server-only, bypasses RLS)
- Pattern: `.from("table").select("columns").eq("col", val)` → `{ data, error }`

**Redis caching** (`lib/redis/client.ts`):

- Upstash Redis with `getCachedOrFetch(key, fetchFn, ttl)` — SWR pattern
- Used for server-side data caching with TTLs from `CACHE_TTL` constants

**QPay / LendMN**: see Payment Providers section above

### Authentication Flow

**System**: Supabase Auth (email/password + OAuth: Google, Apple, Facebook)

**Flow**:

1. Login via `LoginModal` (managed by `ui-store.isLoginOpen`) → Supabase auth
2. OAuth callback: `/auth/callback/route.ts` → `exchangeCodeForSession()`
3. Session stored in cookies (chunked into multiple cookies by Supabase SSR)

**Middleware** (`lib/supabase/middleware.ts` → `updateSession()`):

- Refreshes Supabase session on every request
- Clears stale chunked cookies (>5 chunks) to prevent HTTP 431 (Request Header Fields Too Large)
- Protected routes (`/account`, `/checkout`, `/orders`): redirect to `/login?redirect=...` if unauthenticated
- Auth routes (`/login`, `/register`): redirect to `/` if already authenticated

**Login redirect**: `ui-store.openLogin(redirectUrl?)` stores a redirect URL; after login, user navigates to that URL

### Important Business Rules

- **Currency**: All monetary values in Mongolian Tugrik (MNT), symbol `₮`, formatted via `formatPrice()` with `mn-MN` locale
- **UI language**: Mongolian (all labels, error messages, status strings)
- **Timezone**: `Asia/Ulaanbaatar` — all dates parsed as UTC from Supabase, displayed in local timezone via `formatDate()`
- **Phone format**: 8-digit Mongolian numbers; `stripPhonePrefix()` removes `+976`; `formatPhone()` formats as `XXXX-XXXX`
- **Order numbers**: 8-char alphanumeric: 4 chars from base-36 timestamp + 4 random chars from `[A-Z0-9]`
- **Stock management**: `stock_quantity <= 0` = out of stock; checkout validates sufficient stock for each item+variant
- **Variant requirement**: if a product has active variants, a variant MUST be selected to add to cart / checkout
- **Cart is local-first**: localStorage is source of truth; server sync is best-effort
- **Payment idempotency**: `createOrderAfterPayment()` returns success if order already confirmed — safe for duplicate calls
- **Coupon single-use default**: `usage_limit_per_user` defaults to 1 if not set

### Key File Reference Map

| Domain           | File                                              | Purpose                                                                       |
| ---------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Cart state       | `stores/cart-store.ts`                            | Zustand cart with localStorage persistence + server sync                      |
| Wishlist state   | `stores/wishlist-store.ts`                        | Zustand wishlist with localStorage persistence + server sync                  |
| UI state         | `stores/ui-store.ts`                              | Modals, drawers, toasts, login redirect                                       |
| Checkout logic   | `components/checkout/actions.ts`                  | Server actions: invoice creation, payment check, order creation, coupon usage |
| Checkout page    | `app/checkout/page.tsx`                           | Checkout UI: pricing calculation, coupon discount, delivery fee, payment flow |
| Product queries  | `lib/queries/products.ts`                         | `getProducts()`, `getProductBySlug()`, `getRelatedProducts()`                 |
| Cart queries     | `lib/queries/cart.ts`                             | `addToServerCart()`, `removeFromServerCart()`, `syncLocalToServerCart()`      |
| Wishlist queries | `lib/queries/wishlist.ts`                         | Server wishlist CRUD                                                          |
| Search queries   | `lib/queries/search.ts`                           | `searchProducts()`, `getSearchSuggestions()`, `getTrendingSearches()`         |
| QPay client      | `lib/qpay/client.ts`                              | `createInvoice()`, `checkPayment()`                                           |
| LendMN client    | `lib/lendmn/client.ts`                            | `createLendMNInvoice()`, `getLendMNInvoiceStatus()`                           |
| Supabase clients | `lib/supabase/{client,server,admin}.ts`           | Browser / server / admin Supabase clients                                     |
| Auth middleware  | `lib/supabase/middleware.ts`                      | Session refresh, route protection, cookie cleanup                             |
| Redis cache      | `lib/redis/client.ts`                             | `getCachedOrFetch()` SWR pattern                                              |
| Constants        | `lib/utils/constants.ts`                          | `CACHE_TTL`, `REVALIDATE`, `ROUTES`, `PAYMENT_METHODS`, status labels         |
| Formatters       | `lib/utils/formatters.ts`                         | `formatPrice()`, `formatDate()`, `getDiscountPercentage()`, `formatPhone()`   |
| Types            | `types/database.ts`                               | Supabase-generated table types                                                |
| Types            | `types/product.ts`                                | `CartItem`, `ProductVariant`, `ProductListItem`, `ProductFilters`             |
| Types            | `types/order.ts`                                  | `OrderWithItems`, `Address`, `CheckoutData`, `PaymentMethod`                  |
| Payment callback | `app/api/checkout/callback/route.ts`              | QPay webhook handler                                                          |
| Payment callback | `app/api/checkout/lendmn-callback/route.ts`       | LendMN webhook handler                                                        |
| Cart sync        | `components/providers/CartSyncProvider.tsx`       | Auth-aware cart synchronization                                               |
| Invoice recovery | `components/providers/PendingInvoiceRecovery.tsx` | Recover abandoned payment invoices                                            |

### Edge Cases & Technical Constraints

- **Variant NULL in cart_items**: Supabase partial unique index on `(user_id, product_id, variant_id)` doesn't natively handle NULL equality. Cart uses check-then-insert/update pattern instead of upsert.
- **Image batch loading**: `getProducts()` fetches images in batches of 50 product IDs to avoid Supabase URL length limits on `.in()` queries.
- **Pending invoice recovery**: `recoverPendingInvoices()` only checks invoices between 1 minute and 2 hours old, without an existing `order_id`, limited to 5 invoices per scan.
- **Chunked cookie cleanup**: Supabase SSR stores auth tokens across multiple cookies (`sb-*-auth-token.0`, `.1`, etc.). Middleware clears all chunked cookies if count exceeds 5 to prevent HTTP 431 errors.
- **Cart race condition guard**: `loadFromServer()` refuses to overwrite local cart with empty server result — prevents data loss if server fetch fails during checkout.
- **Coupon scope calculation**: for category-scoped coupons, requires a separate `product_categories` fetch to map cart items to their categories. This mapping is fetched on the checkout page via `useEffect`.
- **LendMN token caching**: OAuth2 token is cached at module level (persists across warm serverless invocations). Cold starts require fresh token fetch.
- **Order cleanup on failure**: if `order_items` insertion fails after `orders` row is created, the orphan order is deleted. Same for `payment_invoices` insertion failure.
- **Idempotent order creation**: `createOrderAfterPayment()` checks if order is already confirmed+paid before calling RPC. The RPC `create_order_from_invoice` itself is idempotent.
- **Mobile consistency**: mobile (Flutter) and web share the same Supabase backend, payment methods (qpay, storepay, pocket, bonum), and order/product data structures. Cart and checkout logic must stay consistent across platforms.

## Hard Rules for AI Agents

- **Mongolian UI text:** All user-facing labels and error messages are in
  Mongolian. Do NOT translate them. If i18n is needed, raise it as a separate
  task.
- **Brand config:** Brand-specific strings (site name, URL, phone country code,
  delivery zone names) live in `lib/utils/brand-config.ts`. Do not hardcode
  them elsewhere.
- **Payment idempotency:** `createOrderAfterPayment()` is idempotent —
  preserve this semantic in any refactor.
- **Cart race-condition guard:** `loadFromServer()` MUST refuse empty server
  result when local has items. Do not "simplify" this.
- **Database migrations:** Never write or modify Supabase migrations during
  feature work or refactors.
