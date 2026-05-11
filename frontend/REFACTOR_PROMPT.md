# E-commerce Frontend & Admin Refactor Plan

## Context

This repository was cloned from "Monpang" — a production e-commerce project.
The codebase is functional but has accumulated technical debt that should be
addressed before adding new features for the new brand.

**Stack:** Next.js 16 (App Router), React 19, TanStack Query v5, Zustand v5,
Tailwind CSS v4, Supabase (Postgres + Auth), Upstash Redis, TypeScript strict.

**Two Next.js apps:**

- `frontend/` — customer-facing storefront (~46k lines)
- `admin/` — admin dashboard (~51k lines)
- Both share the **same Supabase schema** (37 tables).

**Convention docs (read FIRST, before any work):**

- `frontend/CLAUDE.md` — full frontend architecture & business rules
- `admin/CLAUDE.md` — full admin architecture

---

## Refactor Goals

1. **New brand identity** — centralize hardcoded "Monpang" / `monpang.com`
   strings into a single config.
2. **Break up God files** — split files >500 lines into single-responsibility
   modules.
3. **Type safety** — eliminate `any`, regenerate Supabase types, fix
   `eslint-disable` comments.
4. **Reduce duplication** — extract repeated boilerplate into shared
   components/hooks.
5. **Production-grade logging** — replace ad-hoc `console.*` with a structured
   logger.

---

## Hard Invariants (do NOT change these)

1. **Cart item identity:** `productId + variantId` is the unique key. Item ID
   format `"{productId}-{variantId|'default'}-{timestamp}"` must be preserved.
2. **Cart race-condition guard:** `cart-store.loadFromServer()` refuses to
   overwrite local cart with empty server result. Keep this behavior.
3. **Payment idempotency:** `createOrderAfterPayment()` must remain idempotent —
   safe to call multiple times for the same invoice.
4. **Pricing hierarchy:** `variant.discount_price > variant.price >
product.discount_price > product.price`. Business rule, do not alter.
5. **Coupon scope logic:** all/product/category/brand scope handling and
   max_applicable_qty calculation must produce identical results.
6. **Supabase RPC contract:** `create_order_from_invoice` is the single source
   of truth for order finalization. Don't bypass it.
7. **Auth middleware chunked-cookie cleanup:** prevents HTTP 431. Keep the
   ">5 chunks → clear" logic intact.
8. **Mongolian UI text:** all user-facing labels, error messages, status
   strings remain in Mongolian. Do NOT translate them. (i18n is a separate
   future task.)
9. **Database migrations:** do not write or modify Supabase migrations during
   this refactor.
10. **Public function signatures:** when moving a function to a new file, keep
    its signature identical so callers don't need updating. Use `index.ts`
    re-exports to preserve old import paths.

---

## Working Rules

- **Branch per phase.** Create a branch like `refactor/phase-1-brand-config`,
  open a PR (or just commit), then move on.
- **One concern per phase.** Don't mix type cleanup with file splitting.
- **Ask before destructive moves.** If unsure whether a function is still used,
  search before deleting.
- **After every phase, run:**
  - `bun run lint` (in both `frontend/` and `admin/`)
  - `bun run build` (in both)
  - Both must pass before committing.
- **Commit format:** Conventional Commits, e.g.
  `refactor(brand): centralize site identity into brand-config`.
- **Update CLAUDE.md** when file paths change so future agents have correct
  references.

---

## Phase 1 — Brand Config Centralization

### Goal

Centralize hardcoded "Monpang", `monpang.com`, phone country code, and
delivery zone names into one config module.

### Tasks

**1.1 Create** `frontend/src/lib/utils/brand-config.ts`:

```ts
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "ShopName",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? "Shop",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  description: "...",
  ogImage: "/og.jpg",
  twitterHandle: "@shop",
  authorName: "...",
  keywords: ["онлайн дэлгүүр", "..."], // keep Mongolian SEO keywords
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
```

**1.2 Replace hardcoded brand strings** in:

- `frontend/src/app/layout.tsx` (metadata, OpenGraph, Twitter)
- `frontend/src/app/manifest.ts`
- `frontend/src/app/robots.ts`, `sitemap.ts`
- `frontend/src/app/products/(list)/page.tsx`
- `frontend/src/app/articles/page.tsx`, `articles/[slug]/page.tsx`
- `frontend/src/app/brands/page.tsx`
- `frontend/src/app/faq/page.tsx`
- `frontend/src/app/privacy-policy/page.tsx`
- `frontend/src/app/new-arrivals/page.tsx`
- `frontend/src/app/best-sellers/page.tsx`
- `frontend/src/app/events/page.tsx`
- `frontend/src/app/terms-of-service/page.tsx`
- Run `grep -rni "monpang" frontend/src admin/src` to find any remaining
  references.

**1.3 Centralize phone format:**

- All `phone.replace(/^\+?976/, "")` patterns → `stripPhonePrefix()` from
  `lib/utils/formatters.ts`. Update that function to use `LOCALE.phoneRegex`.

**1.4 Replace delivery zone hardcoded strings:**

- All `"Улаанбаатар"` literal comparisons → `DELIVERY_ZONES_CONFIG.capital`.
- Locations: `frontend/src/components/checkout/actions.ts`,
  `frontend/src/app/cart/page.tsx`,
  `frontend/src/app/checkout/page.tsx`, and others.

**1.5 Add** `frontend/.env.example`:

```
NEXT_PUBLIC_BRAND_NAME=
NEXT_PUBLIC_BRAND_SHORT_NAME=
NEXT_PUBLIC_SITE_URL=
```

### Acceptance criteria

- `grep -rni "monpang" frontend/src admin/src` returns no application-code
  matches (config files / docs may keep it).
- `bun run build` succeeds in both apps.
- `<head>` metadata in browser DevTools reflects new brand.

### Commit

`refactor(brand): centralize site identity into brand-config`

---

## Phase 2 — Type Safety Cleanup

### Goal

Reduce `any` usage (frontend: 56, admin: 24) and `eslint-disable` count
(admin: 35) to justified minimums.

### Tasks

**2.1 Regenerate Supabase types:**

```bash
supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

Run for both `frontend/` and `admin/`. Reconcile any drifted columns.

**2.2 Replace `: any` and `as any`:**

```bash
grep -rn ": any\| as any" frontend/src admin/src --include="*.ts" --include="*.tsx"
```

Replacement priority:

- Supabase query results → use generated `Database` types.
- Form values → use React Hook Form generic types.
- Unknown 3rd-party data → `unknown` + type guard.

**Acceptable to keep:**

- `as any` only when no other option exists, AND with a comment explaining why.

**2.3 Audit `eslint-disable` comments:**

```bash
grep -rn "eslint-disable" admin/src --include="*.ts" --include="*.tsx"
```

For each, fix the root cause. `// @ts-expect-error` with a justifying comment
may stay.

### Acceptance criteria

- `: any` / `as any` count: frontend ≤ 10, admin ≤ 5.
- `eslint-disable` count in admin ≤ 5.
- `bun run lint` is clean.

### Commit

`refactor(types): tighten typing across frontend and admin`

---

## Phase 3 — Refactor Checkout God Files

### Goal

Split `frontend/src/components/checkout/actions.ts` (1,812 lines) and
`PaymentModal.tsx` (1,486 lines) into focused modules.

### Tasks

**3.1 Split `actions.ts`** into `frontend/src/components/checkout/actions/`:

- `contact.ts` — `saveContact()`, `ensurePublicUser()`
- `validation.ts` — `validateAddress()`, `validateOrderItems()`,
  `validateCartItems()`
- `delivery.ts` — `calculateDeliveryFee()`
- `invoice.ts` — `createCheckoutInvoice()`,
  `createLendMNCheckoutInvoice()`, `createStorePayCheckoutInvoice()`,
  `generateOrderNumber()`
- `payment-status.ts` — `checkPaymentStatus()`, `recoverPendingInvoices()`
- `order.ts` — `createOrderAfterPayment()`, `recordCouponUsage()`,
  `updateOrderPaymentMethod()`
- `index.ts` — re-export everything so existing import paths still work.

**Constraint:** function signatures must NOT change.

**3.2 Split `PaymentModal.tsx`** into `frontend/src/components/checkout/payment/`:

- `PaymentModal.tsx` — top-level controller (state, modal shell)
- `panels/QPayPanel.tsx`
- `panels/LendMNPanel.tsx`
- `panels/StorePayPanel.tsx`
- `panels/TransferPanel.tsx`
- `hooks/usePaymentPolling.ts` — extracted polling state machine
- `hooks/usePaymentMethodSwitch.ts` — provider switching flow
- `components/PaymentSuccessView.tsx`

**Important:** The `PaymentMethod` discriminated union
(`"qpay" | "lendmn" | "storepay" | "transfer"`) must stay intact — it drives
the state machine.

### Acceptance criteria

- `actions.ts` becomes a thin re-export module (or is deleted in favor of
  `actions/index.ts`).
- `PaymentModal.tsx` ≤ 300 lines.
- Manual smoke test passes for each payment provider:
  cart → checkout → invoice → mock payment → order confirmed.

### Commit

`refactor(checkout): split actions.ts and PaymentModal into focused modules`

---

## Phase 4 — Refactor Remaining God Files

### 4.1 `frontend/src/app/cart/page.tsx` (1,030 lines)

Extract sections to `frontend/src/components/cart/`:

- `CartItemList.tsx`
- `CartCouponSection.tsx`
- `CartPointSection.tsx`
- `CartDeliveryZoneSection.tsx`
- `CartSummary.tsx`

`page.tsx` keeps composition + top-level data fetching only.

### 4.2 `frontend/src/components/product/ProductDetailClient.tsx` (1,217 lines)

- `ProductGallery.tsx` (image carousel + zoom)
- `ProductPricing.tsx` (variant pricing display)
- `ProductActions.tsx` (add-to-cart, wishlist, share)
- `ProductInfoTabs.tsx` (description, specs, reviews tabs)
- `useProductGallery.ts`

### 4.3 `frontend/src/components/profile/OrderDetailView.tsx` (822 lines)

- `OrderItems.tsx`, `OrderTimeline.tsx`, `OrderPaymentInfo.tsx`,
  `OrderDeliveryInfo.tsx`, `OrderActions.tsx`

### 4.4 `admin/src/hooks/useProductEdit.ts` (975 lines)

- `useProductForm.ts` — main form state
- `useVariantBuilder.ts` — combinations + SKU generation
- `useProductImages.ts` — upload/reorder
- `useProductOptions.ts` — option groups CRUD

### 4.5 `admin/src/components/category/Categories.tsx` (803 lines)

- `CategoryTree.tsx` (display)
- `CategoryFormDialog.tsx`
- `useCategoryDnd.ts` (DnD reorder hook)

### Acceptance criteria

- Every refactored file ≤ 350 lines.
- Smoke test: cart edit, checkout, product detail, order view, product
  create/edit, category CRUD all work.

### Commits (one per sub-task)

`refactor(cart): split page.tsx into focused sections`
`refactor(product): split ProductDetailClient`
`refactor(profile): split OrderDetailView`
`refactor(admin): split useProductEdit`
`refactor(admin): split Categories component`

---

## Phase 5 — Logging Cleanup

### Goal

Replace 150+ `console.*` calls with a structured logger gated by environment.

### Tasks

**5.1 Create** `frontend/src/lib/utils/logger.ts` and a similar one in `admin/`:

```ts
const isDev = process.env.NODE_ENV !== "production";
export const log = {
  info: (...a: unknown[]) => isDev && console.log("[info]", ...a),
  warn: (...a: unknown[]) => console.warn("[warn]", ...a),
  error: (...a: unknown[]) => console.error("[error]", ...a),
};
```

If you have observability (Sentry, Logflare, etc.), wire `log.error` to send
events.

**5.2 Replace usages:**

- `console.log` (debug-only) → `log.info`
- `console.error` → `log.error`
- `console.warn` → `log.warn`

**5.3 Delete** debug-only logs that no longer have value.

### Acceptance criteria

- Production build contains ≤ 5 raw `console.*` calls (only critical errors).

### Commit

`refactor(logging): replace console.* with structured logger`

---

## Phase 6 — Design System Tokens (optional, P3)

### Goal

Extract repeated Tailwind class patterns into reusable typography/layout
components.

### Tasks

Create `frontend/src/components/ui/typography.tsx`:

```tsx
export function MutedText({ children, className }: Props) {
  return (
    <span
      className={cn(
        "text-slate-500 text-sm font-normal hover:text-slate-700 transition-colors",
        className,
      )}
    >
      {children}
    </span>
  );
}
// ...PrimaryText, Label, Heading, etc.
```

Only extract patterns that appear 15+ times in the codebase. Don't extract
short patterns like `flex items-center` — those are clearer inline.

### Acceptance criteria

- Visual regression: capture before/after screenshots of key pages, diff them.
  No unintended styling changes.

### Commit

`refactor(ui): extract typography components from repeated patterns`

---

## Phase 7 — Dependency Cleanup (optional, P3)

### Goal

Reduce admin's 62 dependencies — remove unused, deduplicate redundant.

### Tasks

**7.1** Run `npx depcheck` in both apps. Remove unused.

**7.2 Deduplicate:**

- `radix-ui` (umbrella) vs `@radix-ui/*` (individual) — pick one approach.
- `xlsx` vs `exceljs` — pick one (audit which is actually used for export).
- `pptxgenjs` — verify usage; remove if unused.

### Acceptance criteria

- `bun run build` succeeds.
- Bundle size reduced (compare `bun run build` output before/after).

### Commit

`chore(deps): remove unused dependencies and deduplicate`

---

## Execution Order

Run phases sequentially: 1 → 2 → 3 → 4 → 5. Phases 6 & 7 are optional and
can run anytime after Phase 5.

Before starting each phase:

1. Confirm you've read both `CLAUDE.md` files.
2. Summarize your plan for the phase in 5-10 bullet points.
3. Wait for my approval.
4. Execute. After completion, report results: lint output, build output,
   files touched, commit hash. Then proceed to the next phase.

If anything is ambiguous — especially around business logic (delivery zones,
payment provider configs, coupon scope rules) — STOP and ask. Do not guess.
