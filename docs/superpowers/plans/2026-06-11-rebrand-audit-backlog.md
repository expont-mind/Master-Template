# Rebrand-Audit Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/rebrand` actually redesign (not just recolor), wire the dead `@repo/theme` token system into the frontend and codemod 1404 raw-hex Tailwind classes onto it, make feature flags self-gating, add a config-driven auth channel, and fix routing/transition stragglers — per the verified findings of the xbox-shop rebrand audit.

**Architecture:** Three layers of change: (1) AI-skill markdown rewrites in `.claude/commands/` that add a mandatory, reference-driven per-route redesign phase plus a coverage gate; (2) a token-wiring + codemod pass that imports `@repo/theme` CSS into the frontend and rewrites every value-matched arbitrary hex class to its semantic utility, enforced by new ESLint rules; (3) component-level fixes (wrapper/inner self-gating for optional features, `SITE.auth.method` channel switching, ROUTES single-source-of-truth links).

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS v4 (CSS-first, no tailwind.config), Turborepo + pnpm workspaces, ESLint 9 flat config, Vitest (packages only), Supabase auth (phone OTP today).

**Verified baseline (2026-06-11):** `pnpm type-check` green across 11 packages. Audit findings re-verified against THIS repo by a 7-agent sweep; xbox-only defects (body gradient, footer-reserve, `"**"` image wildcard, mock-data seam) are absent here and are **out of scope**. All file:line refs below are from the verified sweep, not the original audit.

---

## Inventory of verified facts the tasks rely on

- `.claude/commands/rebrand.md` — Step 1.5 at :69 (token-only "Design system swap"), Step 1 DO-NOT-touch list at :61-64 _contradicts_ 1.5a/1.5e which edit `layout.tsx`; 1.5a references nonexistent `apps/frontend/tailwind.config.ts`; Step 4.5 at :243 fully skippable (menu skip :269, per-page skip :310), menu lists nonexistent `app/products/page.tsx` (:261, real: `app/products/(list)/page.tsx`); Step 5 (:323-341) has no structural coverage gate; Step 6 report prints 🎉 even with 0 pages redesigned (:348-354).
- `.claude/commands/rebrand-init.md` — promises "layout" at :21-22 and :114; no auth question group.
- `rebrand.config.example.yaml` — top-level keys brand/theme/contact/social/payments/features/delivery/legal/design; **no auth block**.
- `apps/frontend/src/app/globals.css` (111 lines) — imports only `tailwindcss` (:1); re-declares `:root` tokens (:3-26) incl. `--color-accent-rose: #f43f5e` (:12, name-drifted copy of brand-primary); own `@theme inline` (:28-44); status tokens in `:root` but **not** in `@theme` (status utilities don't resolve); no `.dark` block, no `@custom-variant dark`.
- `apps/frontend/src/app/layout.tsx` — `<body className="min-h-screen bg-white font-sans text-zinc-900 antialiased">` (:97); `<NextTopLoader color="#020617">` (:98); `<main className="flex-1">` (:120).
- `packages/theme/package.json` — exports `./brand.css` and `./tokens.css`; declared as dep + transpilePackages by both apps; **never imported by any app CSS** (B4).
- ~40 `dark:` utilities in frontend `ui/` primitives (Modal/Drawer/Card) bind to `prefers-color-scheme` because `@custom-variant dark` is absent → partial dark flip on OS dark mode while body stays `bg-white` (B2 extra hazard).
- E1 tally (frontend src, `*.ts/tsx`): **1404** occurrences of `(bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow)-[#hex]`, 51 distinct classes, 39 unique hexes; 1327 (94.5%) exactly equal a brand.css token value; 0 uses of `bg-brand-*`/`var(--color-brand-*)`. Existing partial migration (126 semantic-utility usages: `text-text-primary` 40, `text-accent-rose` 22, `border-text-primary` 16, …) establishes the naming convention. Admin has only 6 print-label hexes (keep, with disable comments).
- C inventory — `SITE.features.reviews` referenced exactly twice: call-site guard `ProductDetailLeftColumn.tsx:188`, self-gate `_card/_shared.tsx:74` (`RatingBlock`). Unguarded review surfaces: `ReviewsDrawer.tsx` (mounted via `ProductDetailModals.tsx:64`), `ReviewPrompt.tsx` (home `page.tsx:84`), `ProductCardHorizontal.tsx:51-58` (hand-rolled stars), `ProductInfoDesktop.tsx:102-126` (inline star row), `ProductRatingButton` (via `ProductInfoMobile.tsx:77-81`), `_useProductCard.ts:19` (unconditional `useReviewSummary`). `PointActivationPrompt.tsx` has **no** pointSystem gate (mounted at home `page.tsx:77`). **No `notifications` flag exists**; `NotificationPanel` mounted unguarded at frontend `Header.tsx:161` and admin `navbar.tsx:159` (admin = operator tooling, stays always-on by decision).
- D inventory — frontend login is **phone/SMS**: `auth/_useLoginFlow.ts` (local `formatPhoneE164` :12-16 with hardcoded `"976"`), `auth/_LoginPhoneStep.tsx`; wishlist `_hooks/useWishlistAuth.ts:60-62,79-83` (sms, builds E.164 from `LOCALE.phoneCountryCode`); profile `_usePhoneVerification.ts:46,69,92` + `PhoneContent.tsx:44` hardcode `"+976"`; admin login is email OTP (`_useLogin.ts:49,118-122`, leave as-is). No `SITE.auth`, no `formatPhoneE164` in `@repo/ui-utils` (`formatPhone` is display-only `XXXX-XXXX`).
- F1 — `transition-all` in layout chrome: `layout/_components/HeaderCategoryDropdown.tsx:19`, `layout/CategoryMenu.tsx:80`. Good scoped references: `Header.tsx:101` (`transition-[max-height]`), `MobileCategoryMenu.tsx:59` (`transition-transform`).
- G1 — `ROUTES` at `lib/utils/constants.ts:118-123`. Hand-built `/products/${…}`: id-fallback at `home/RotatingPromoBanner.tsx:28`, `home/_carousel/_types.ts:35`, `profile/order/OrderItemsList.tsx:54`, `profile/OrderDetailView.tsx:120`, `profile/OrderCard.tsx:201`; plain at `app/sitemap.ts:67`, `products/[slug]/_lib/buildMetadata.ts:60,65`, `products/[slug]/page.tsx:75`, `seo/JsonLd.tsx:92,143`. Mitigation: `_productBySlugQueries.ts:59` resolves UUIDs, so id URLs work — fix is SSOT + canonical-URL hygiene, **keep** the `?? id` fallback semantics via `ROUTES.PRODUCT(slug ?? id)`.
- G2 — empty/undefined category emitters: `RotatingPromoBanner.tsx:31` (`?? ""`), `_carousel/_types.ts:38` (**no** fallback → literal `undefined`), `RelatedProductsSection.tsx:32` (`?? ""`).

---

### Task 1: Rewrite `/rebrand` skill — token layer renamed, mandatory redesign phase, coverage gate (A1-A6)

**Files:**

- Modify: `.claude/commands/rebrand.md`
- Modify: `.claude/commands/rebrand-init.md`
- Modify: `.claude/commands/rebrand-check.md`

- [x] **Step 1.1: rebrand.md — fix Step 1 contradiction + rename Step 1.5.** In the Step 1 DO-NOT-touch list (:61-64) change "Any `apps/frontend/**` or `apps/admin/**` source files" to "Any `apps/frontend/**` or `apps/admin/**` source files **except the two `layout.tsx` edits Step 1.5 explicitly authorizes**". Rename heading `# Step 1.5 — Design system swap (NEW)` → `# Step 1.5 — Design token layer`. Add immediately under it: "This step only sets **design tokens** (fonts, radius, shadow, spacing, color mode). It does NOT redesign any page — that is Step 4.5, which is **mandatory** when `design:` is set."

- [x] **Step 1.2: rebrand.md — fix 1.5a Tailwind v4 reality.** Delete the `tailwind.config.ts` sub-edit (there is no such file; Tailwind v4 is CSS-first). Replace with: update the `@theme inline` font mappings in `apps/frontend/src/app/globals.css` (`--font-sans`, `--font-heading`) and the `next/font` loaders in both `layout.tsx` files.

- [x] **Step 1.3: rebrand.md — make 1.5e real.** Rewrite 1.5e to reference the now-working dark wiring (Task 3): `light` → no change; `dark` → add `dark` to `<html className>`; `auto` → inline `prefers-color-scheme` script. Note that `html.dark` token overrides live in `packages/theme/src/brand.css` and are per-client tunable.

- [x] **Step 1.4: rebrand.md — replace Step 4.5 wholesale** with the mandatory per-route redesign phase (full text in the A4 spec): CORE*ROUTES = `app/page.tsx`, `app/products/(list)/page.tsx` (corrected path), `app/products/[slug]/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx` — non-skippable when `design:` is set; secondary routes via AskUserQuestion; one-time **reference distillation** (WebFetch each `design.references[].url`, distill `take` + `aesthetic`/`density`/`componentVibe` into a written per-route layout spec persisted to `docs/rebrand/design-spec.md`); per route: pin the business-logic contract (data fetching, state, handlers, routing, auth/loading gates, all Mongolian strings) → rewrite JSX from the spec composing existing `@/components/ui/*`primitives + new`\*\*Layout.tsx`primitives → re-attach contract verbatim → type-check the file; write per-route status to`docs/rebrand/redesign-manifest.json` (`{route, status: "redesigned"|"kept"|"skipped"}`). Keep hard rules 4.5c verbatim.

- [x] **Step 1.5: rebrand.md — coverage gate in Step 5 + honest report in Step 6.** Step 5 additions, after the brand-leakage grep: (a) if `design:` is set, read `docs/rebrand/redesign-manifest.json` and **FAIL** if any CORE route is not `"redesigned"`; (b) assert `apps/frontend/src/app/globals.css` imports `@repo/theme/brand.css` (grep). Step 6: replace the boolean redesign line with `Page redesign: {N} of {M} core routes` + per-route status list; when `design:` is set and N<M, output the ✗ failure block instead of 🎉.

- [x] **Step 1.6: rebrand-init.md — align the promise + add auth group.** :21-22 and :114 stay (the promise is now backed by mandatory Step 4.5) but append to option (a): "(core 5 хуудасны layout-ийг заавал шинэчилнэ)". Add **Group 12: Auth арга** (AskUserQuestion): "Нэвтрэх арга?" — options `phone (SMS OTP — Supabase SMS provider шаардана)` / `email (Email OTP)`; emit `auth:\n  method: "{phone|email}"` into the YAML template in Step 3 (before the design block).

- [x] **Step 1.7: rebrand-check.md — add the same coverage gate**: if `rebrand.config.yaml` has `design:` set, check `docs/rebrand/redesign-manifest.json` core-route coverage; assert globals.css imports `@repo/theme/brand.css`; report `Page redesign : N/M core routes` and `Theme wiring : ✓/✗` lines; BLOCKED when gate fails.

- [x] **Step 1.8:** Add `auth.method` block to `rebrand.config.example.yaml` (after `legal:`):

```yaml
# Auth channel for customer login (wishlist gate, login modal, profile verification).
# phone  = SMS OTP (requires an SMS provider configured in Supabase)
# email  = Email OTP (works with Supabase email out of the box)
auth:
  method: "phone"
```

And in rebrand.md Step 1, map it to config-site env / source: set `NEXT_PUBLIC_AUTH_METHOD` in Step 4's `.env.local` generation; validate the value in Step 0.

### Task 2: Wire `@repo/theme` into the frontend + new tokens + dark variant (B1/B2/B3/B4 prerequisites for E1)

**Files:**

- Modify: `packages/theme/src/brand.css` (add `--color-border-strong`, `html.dark` block)
- Modify: `packages/theme/src/tokens.css` (map `--color-border-strong`)
- Modify: `apps/frontend/src/app/globals.css` (import theme CSS, delete duplicated blocks, add `@custom-variant dark`)
- Modify: `apps/frontend/src/app/layout.tsx` (`bg-background text-foreground`, TopLoader var)

- [x] **Step 2.1:** brand.css: add `--color-border-strong: #cbd5e1;` after `--color-border-light`; append an `html.dark { … }` block overriding background/foreground/surface/borders/text tokens with conservative inversions, commented "per-client tunable; inert unless <html> has .dark".
- [x] **Step 2.2:** tokens.css: add `--color-border-strong: var(--color-border-strong);`.
- [x] **Step 2.3:** globals.css: replace lines 1-44 with:

```css
@import "tailwindcss";
@import "@repo/theme/brand.css";
@import "@repo/theme/tokens.css";

/* dark: utilities activate only via the .dark class (set per rebrand.config
   design.defaultMode), never via the OS media query. */
@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-manrope);
  --font-manrope: var(--font-manrope);
  --font-mono: var(--font-geist-mono);
}
```

Update `body` rule to `background: var(--color-background); color: var(--color-foreground);` (font-family line unchanged). Keep scrollbar/skeleton/keyframes/mobile-zoom rules.

- [x] **Step 2.4:** layout.tsx: body className → `"min-h-screen bg-background font-sans text-foreground antialiased"`; `<NextTopLoader color="var(--color-text-primary)" …>`.
- [x] **Step 2.5:** Codemod `accent-rose` → `brand-primary` across frontend src (`text-accent-rose`→`text-brand-primary`, `border-accent-rose`→`border-brand-primary`, `bg-accent-rose`→`bg-brand-primary`); `var(--color-accent-rose)`→`var(--color-brand-primary)` if any.
- [x] **Step 2.6:** `pnpm -F @monpang/frontend type-check` then `pnpm turbo build --filter=@monpang/frontend --force` → expect green; visually nothing changes (token values identical).

### Task 3: Hex-literal codemod (E1)

**Files:** ~120 files under `apps/frontend/src` (script-driven); `apps/admin/src/components/order/_orderBoxLabel.tsx`, `_productsPrintTable.tsx` (disable comments)

- [x] **Step 3.1:** Write `/tmp/hex-codemod.py`: for every `*.ts/tsx` under `apps/frontend/src`, regex-replace `(prefix)-\[#(hex)\]` (prefixes: bg|text|border|ring|from|to|via|fill|stroke|divide|outline) using the value→token map: `020617`→`text-primary`, `64748b`→`text-secondary`, `94a3b8`→`text-muted`, `475569`→`text-subtle`, `e2e8f0`→`border`, `f1f5f9`→`border-light`, `cbd5e1`→`border-strong`, `f8fafc`→`surface`, `1e293b`→`surface-dark`, `f43f5e`→`brand-primary`, `fff1f2`→`status-error-bg`, `fffbeb`→`status-warning-bg`, `d97706`→`status-warning-text`, `f0fdf4`→`status-success-bg`, `16a34a`→`status-success-text`, `eff6ff`→`status-info-bg`, `2563eb`→`status-info-text`. Standard-palette one-offs map to palette classes: `dc2626`→`red-600`, `ef4444`→`red-500`, `b91c1c`→`red-700`, `991b1b`→`red-800`, `fef2f2`→`red-50`, `fecaca`→`red-200`, `f59e0b`→`amber-500`, `fef3c7`→`amber-100`, `92400e`→`amber-800`, `a16207`→`yellow-700`, `14b8a6`→`teal-500`, `0d9488`→`teal-600`, `f0fdfa`→`teal-50`, `ccfbf1`→`teal-100`, `3b82f6`→`blue-500`, `bfdbfe`→`blue-200`, `10b981`→`emerald-500`, `0f172a`→`slate-900`, `334155`→`slate-700`. Case-insensitive hex match. Leave AMBIGUOUS set for manual review: `e11d48` (4×), `fb7185`/`fda4af`/`fecdd3` (rose tints, 1× each), `0588f0` (6×), `e8edf2` (skeleton, stays in CSS). Script prints every file touched + per-class counts + remaining unmatched.
- [x] **Step 3.2:** Run it; then manually resolve the ambiguous occurrences by reading each context (`e11d48` → `brand-primary-hover` when hover-state of rose, else `status-error-text`; rose tints → `brand-primary` opacity variants e.g. `text-brand-primary/60`; `0588f0` → inspect, likely provider color → add a semantic token if provider-brand, else `blue-500`).
- [x] **Step 3.3:** Verify: `grep -roE '(bg|text|border|ring|from|to|via|fill|stroke|divide|outline)-\[#[0-9a-fA-F]{3,8}\]' apps/frontend/src --include='*.tsx' --include='*.ts' | wc -l` → **0**. `pnpm -F @monpang/frontend type-check` → green. `pnpm turbo build --filter=@monpang/frontend --force` → green.
- [x] **Step 3.4:** Admin print labels: add `{/* print-fidelity colors, intentionally literal */}` + eslint-disable comments on the 3 lines.

### Task 4: ESLint enforcement (E1/G1/F1)

**Files:** Modify `packages/eslint-config/next.mjs`

- [x] **Step 4.1:** Add to the shared baseline flat config: a rules object with `no-restricted-syntax` selectors for (a) string literals and (b) template elements matching `(bg|text|border|ring|from|to|via|fill|stroke|divide|outline)-\[#…\]` → message "Use a semantic token class wired to @repo/theme brand.css (e.g. text-text-primary, bg-brand-primary)"; (c) template elements ending `/products/` → "Use ROUTES.PRODUCT(slug) from lib/utils/constants"; plus a `files: ["**/components/layout/**"]`-scoped object adding (d) literal containing `transition-all` → "Use a scoped transition (transition-colors, transition-[max-height,opacity]) in layout chrome" (the scoped object must repeat selectors a-c since `no-restricted-syntax` does not merge).
- [x] **Step 4.2:** Exempt the ROUTES factory (`lib/utils/constants.ts`) with one `// eslint-disable-next-line no-restricted-syntax` at the `PRODUCT:`/`CATEGORY:` template literals.
- [x] **Step 4.3:** `pnpm lint` → green (proves codemod completeness mechanically).

### Task 5: Feature-flag self-gating (C1-C6 + notifications flag)

**Files:**

- Modify: `packages/config-site/src/index.ts` (+`notifications` flag)
- Modify: `rebrand.config.example.yaml`, `.claude/commands/rebrand-init.md` (Group 9 list +notifications)
- Modify: `apps/frontend/src/components/product/Reviews.tsx`, `ReviewsDrawer.tsx`, `home/ReviewPrompt.tsx`, `home/PointActivationPrompt.tsx`, `notification/NotificationPanel.tsx`, `_card/ProductCardHorizontal.tsx`, `_card/_useProductCard.ts`, `_productDetail/ProductInfoDesktop.tsx`, `_productDetail/ProductRatingButton.tsx`, `_productDetail/ProductDetailLeftColumn.tsx`, `lib/hooks/useReviews.ts`, `layout/Header.tsx` (bell trigger)
- Modify: `CLAUDE.md` (document the wrapper/inner pattern as required)

- [x] **Step 5.1:** config-site: add `notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS !== "false",` to `features`; example yaml + rebrand-init Group 9 get the same flag.
- [x] **Step 5.2:** Apply the wrapper/inner split (gate component exports null before any hook runs):

```tsx
export function X(props: XProps) {
  if (!SITE.features.<flag>) return null;
  return <XInner {...props} />;
}
```

to `Reviews` (reviews), `ReviewsDrawer` (reviews), `ReviewPrompt` (reviews), `PointActivationPrompt` (pointSystem), `NotificationPanel` (notifications, frontend only — admin panel deliberately stays).

- [x] **Step 5.3:** `ProductCardHorizontal`: replace the inline star block (:51-58) with `<RatingBlock averageRating={…} totalCount={…} size="xs" />` from `./_shared`.
- [x] **Step 5.4:** `useReviews.ts`: add `enabled: SITE.features.reviews && <existing condition>` to `useReviewSummary` (and sibling hooks) so card/detail queries never fire when off.
- [x] **Step 5.5:** `ProductInfoDesktop.tsx:102-126`: wrap the star row + "{reviewCount} Сэтгэгдэл" button in `{SITE.features.reviews && (…)}`. `ProductRatingButton.tsx`: self-gate (pure presentational → plain early return is fine, no hooks).
- [x] **Step 5.6:** Delete the now-redundant call-site guard in `ProductDetailLeftColumn.tsx:188` (keep the JSX it wrapped).
- [x] **Step 5.7:** Header bell: gate the notification trigger button + panel mount on `SITE.features.notifications`.
- [x] **Step 5.8:** CLAUDE.md (root): under Hard Rules add: "**Feature-flag gating:** every optional subsystem's entry component must self-gate (`if (!SITE.features.X) return null;` wrapper before any hook). Call sites must NOT carry flag guards."
- [x] **Step 5.9:** Verify: `grep -rn "SITE.features" apps/frontend/src` shows gates only inside entry components/route pages; type-check green.

### Task 6: `auth.method` config + shared E.164 (D1-D4)

**Files:**

- Modify: `packages/config-site/src/index.ts` (`auth` block + `AuthMethod` export)
- Modify: `packages/ui-utils/src/formatters.ts` + `formatters.test.ts` (`formatPhoneE164`)
- Modify: `apps/frontend/src/components/auth/_useLoginFlow.ts`, `LoginModal.tsx`, new `_LoginEmailStep.tsx`
- Modify: `apps/frontend/src/app/wishlist/_hooks/useWishlistAuth.ts`, `_components/LoginPrompt.tsx`
- Modify: `apps/frontend/src/components/profile/_usePhoneVerification.ts`, `PhoneContent.tsx`, `PhoneVerificationModal.tsx`, `app/data-deletion/_components/DataDeletionForm.tsx` (+976 spans → LOCALE)

- [x] **Step 6.1:** ui-utils TDD: write failing tests for `formatPhoneE164("99123456") === "+97699123456"`, idempotence on `"+97699123456"` and `"97699123456"`, strips spaces/dashes; implement using `LOCALE.phoneCountryCode`; `pnpm -F @repo/ui-utils test` green.
- [x] **Step 6.2:** config-site:

```ts
export type AuthMethod = "phone" | "email";
// inside SITE:
auth: {
  method: (process.env.NEXT_PUBLIC_AUTH_METHOD as AuthMethod) ?? "phone",
},
```

- [x] **Step 6.3:** `_useLoginFlow.ts`: delete the local hardcoded `formatPhoneE164` (:12-16), import the shared one; branch send/verify on `SITE.auth.method` (`email` → `signInWithOtp({ email })` / `verifyOtp({ email, token, type: "email" })` — mirror admin `_useLogin.ts`).
- [x] **Step 6.4:** `LoginModal.tsx`: render `_LoginEmailStep` (new, modeled on `_LoginPhoneStep` with email input + validation) when `SITE.auth.method === "email"`.
- [x] **Step 6.5:** `useWishlistAuth.ts`: same channel branch; `LoginPrompt.tsx`: render email input when `email`; phone-prefix span → `+{LOCALE.phoneCountryCode}`.
- [x] **Step 6.6:** Profile: `_usePhoneVerification.ts`/`PhoneContent.tsx` use `formatPhoneE164`; `PhoneVerificationModal.tsx`/`DataDeletionForm.tsx` spans from LOCALE; when `SITE.auth.method === "email"`, profile phone-verification entry points return null.
- [x] **Step 6.7:** Verify: `grep -rn '+976' apps/frontend/src` → only LOCALE-derived (0 literals); type-check + frontend build green.

### Task 7: Transitions + routing SSOT (F1, G1, G2) + doc touch-ups

**Files:**

- Modify: `layout/_components/HeaderCategoryDropdown.tsx:19` (`transition-all` → `transition-[max-height,opacity]`), `layout/CategoryMenu.tsx:80` (→ `transition-colors`)
- Modify: `home/RotatingPromoBanner.tsx:28,31`, `home/_carousel/_types.ts:35,38`, `profile/order/OrderItemsList.tsx:54`, `profile/OrderDetailView.tsx:120`, `profile/OrderCard.tsx:201`, `_productDetail/RelatedProductsSection.tsx:32`, `app/sitemap.ts:67`, `products/[slug]/_lib/buildMetadata.ts:60,65`, `products/[slug]/page.tsx:75`, `seo/JsonLd.tsx:92,143`
- Modify: `apps/frontend/CLAUDE.md` (stale file map + transition rule)

- [x] **Step 7.1:** Product links → `ROUTES.PRODUCT(slug ?? id)` (UUIDs resolve by design here — `_productBySlugQueries.ts:59`; keep the fallback, route it through the factory). Category links → `category?.slug ? ROUTES.CATEGORY(category.slug) : "/products"` (graceful unfiltered-listing fallback; kills `?category=` and `?category=undefined`).
- [x] **Step 7.2:** Transition swaps per above; sweep `components/cart/` `transition-all` (CouponSelectModal:131, ClearCartModal:73, PointSelectModal:120, \_VariantOptionsGrid:139) → `transition-colors`.
- [x] **Step 7.3:** frontend CLAUDE.md: fix `products/page.tsx` → `products/(list)/page.tsx`, remove CartDrawer claim, add "no `transition-all` in layout chrome — list properties explicitly" rule.
- [x] **Step 7.4:** `grep -rn '/products/\${' apps/frontend/src` → only `constants.ts`; lint green.

### Task 8: Final verification

- [x] `pnpm format` (write), then `pnpm lint`, `pnpm type-check --force`, `pnpm test`, `pnpm turbo build --filter=@monpang/frontend --filter=@monpang/admin --force` (--force busts the stale `game-shop` turbo cache). All green. Re-run the three acceptance greps (hex classes 0; `+976` literals 0; `/products/${` only ROUTES).

---

## Self-review notes

- Spec coverage: A1-A6 → Task 1; B1-B4 → Task 2 (B1/B3 in their verified template form: light-locked body + dead dark path); C1-C6 → Task 5; D1-D4 → Task 6 (scoped to `phone|email`; `both` deferred — YAGNI, would ship untested UI); E1 → Tasks 2-4; F1 → Task 7 (F2/F3 verified absent); G1/G2 → Task 7 (G3/G4 verified absent).
- Deliberate deviations from the original backlog, justified by verification: no gradient/footer/overscroll/mock work (absent here); id-fallback links keep resolving (template's slug query handles UUIDs — removing the fallback would break order-history links for deleted products for no gain); admin NotificationPanel stays ungated (operator tooling).
- Commits: per repo rule, the executor must NOT commit — the working tree already carries the in-flight monorepo refactor; the user reviews and commits.
