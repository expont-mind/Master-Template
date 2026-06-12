# AI Prompts — Rebranding & Customization Playbook

Ready-to-paste prompts for AI agents (Claude, GPT, Cursor, etc.) to customize this template for a new client. Each prompt is **scoped** — the agent should only touch the listed files. Paste the relevant prompt at the start of a fresh agent session.

---

## 1. Full rebrand for new client

Use when starting a new client project from scratch.

```
You are customizing the Monpang e-commerce master template for client "{CLIENT_NAME}".

CONTEXT:
- Brand: {CLIENT_NAME}
- URL: {CLIENT_URL} (e.g. https://acme.mn)
- Admin URL: {CLIENT_ADMIN_URL} (e.g. https://admin.acme.mn)
- Primary brand color: {PRIMARY_HEX} (e.g. #0066cc)
- Secondary brand color: {SECONDARY_HEX}
- Accent color: {ACCENT_HEX}
- Contact phone: {PHONE} (Mongolian +976 format)
- Contact email: {EMAIL}
- Address: {ADDRESS}
- Social: instagram={IG_HANDLE}, facebook={FB_HANDLE}, tiktok={TT_HANDLE}, youtube={YT_HANDLE}
- Active payment providers: {ENABLED_PROVIDERS} (subset of qpay, lendmn, storepay, transfer)
- Legal jurisdiction: {COUNTRY} (default "Mongolia")

TASK:
Update these files ONLY. Do NOT change business logic, cart/checkout flow, payment
integration code, database schema, or migrations.

1. packages/config-site/src/index.ts
   - SITE.contact.{phone,email,supportEmail,address}
   - SITE.social.{instagram,facebook,youtube,tiktok}
   - SITE.payments.* (disable providers not in {ENABLED_PROVIDERS})
   - SITE.legal.{jurisdiction,privacyEmail,companyRegistration}

2. packages/theme/src/brand.css
   - --color-brand-primary, --color-brand-primary-hover, --color-brand-primary-active
   - --color-brand-secondary, --color-brand-accent
   - Foreground variants should be black or white depending on contrast

3. Replace asset files (flag, do not edit binary content):
   - apps/frontend/public/logo.svg
   - apps/frontend/public/favicon.ico
   - apps/frontend/public/og-image.png (1200x630)
   - apps/admin/public/logo.svg
   Output a list of files that need manual asset replacement.

4. apps/frontend/src/app/privacy-policy/page.tsx and terms-of-service/page.tsx
   - Update jurisdiction text from "Монгол Улсын" to {COUNTRY_GENITIVE} if {COUNTRY} != "Mongolia"
   - Contact info is already templatized via SITE.contact — verify no hardcoded strings remain

CONSTRAINTS:
- All user-facing text stays in Mongolian unless explicitly told otherwise (existing rule).
- Do not modify Supabase clients, payment provider clients, or stores.
- Run `pnpm format && pnpm lint && pnpm type-check && pnpm build` after changes.

VERIFICATION:
After making changes, run:
  git grep -i "monpang" -- ':!docs/' ':!packages/config-brand/' ':!CLAUDE.md'
This must return ZERO results.
```

---

## 2. Update primary brand color only

Use when the client wants a color tweak without a full rebrand.

```
You are updating the brand color of the active e-commerce site.

Edit packages/theme/src/brand.css and change ONLY:
- --color-brand-primary: {NEW_HEX}
- --color-brand-primary-hover: {NEW_HEX_DARKER} (about 10% darker)
- --color-brand-primary-active: {NEW_HEX_DARKEST} (about 20% darker)
- --color-brand-primary-foreground: {WHITE_OR_BLACK_BY_CONTRAST}

Do not touch any other files. Do not edit components — they reference these tokens via Tailwind utilities (`bg-brand-primary`, etc.).

Verify by running `pnpm dev` and checking the header CTA button color in browser.
```

---

## 3. Toggle payment provider

Use when adding or removing a payment method.

```
You are toggling payment provider "{PROVIDER}" ({"on"|"off"}) for the active site.

Edit packages/config-site/src/index.ts:
  SITE.payments.{PROVIDER} = {true|false}

If turning ON: ensure the corresponding env vars are set in `.env.local`:
  - qpay → QUICKPAY_API_URL, QUICKPAY_API_KEY, QUICKPAY_MERCHANT_ID, QUICKPAY_ACCOUNT_NUMBER
  - lendmn → LENDMN_API_URL, LENDMN_CLIENT_ID, LENDMN_CLIENT_SECRET, LENDMN_WALLET_ID
  - storepay → STOREPAY_API_URL, STOREPAY_USERNAME, STOREPAY_PASSWORD, STOREPAY_STORE_ID

Do not change any code in apps/frontend/src/lib/{qpay,lendmn,storepay}/. The provider
clients are stateless and pick up env vars at runtime.

Verify by visiting /checkout and confirming the provider does/does not appear in the
payment method picker.
```

---

## 4. Disable a feature flag

Use when a client doesn't want, e.g., the wishlist or reviews surface.

```
You are disabling feature "{FEATURE}" for the active site.

1. Edit packages/config-site/src/index.ts:
   SITE.features.{FEATURE} = false

2. Wrap conditional rendering in feature-flagged components:
   - reviews → ProductReviews, ReviewModal, RatingModal
   - wishlist → WishlistButton, /wishlist page, WishlistSyncProvider
   - coupons → CouponBanner, /coupons page
   - articles → ArticlesCarousel, /articles route
   - events → EventsCarousel, /events route
   - pointSystem → PointActivation, PointContent, PointDetailModal

Use this pattern:
  import { SITE } from "@repo/config-site";
  if (!SITE.features.{FEATURE}) return null;

Do not delete the components — keep them so the flag can be re-enabled. Do not
modify business logic (cart, checkout, orders).
```

---

## 5. Update contact info via env

Use when the client moves office or changes phone number.

```
You are updating the contact info shown in Footer, Privacy Policy, and Terms of Service.

Two equivalent approaches — choose ONE:

A. Environment variables (preferred for production — no code change):
   Set in Vercel project env vars + `.env.local`:
     NEXT_PUBLIC_CONTACT_PHONE="..."
     NEXT_PUBLIC_CONTACT_EMAIL="..."
     NEXT_PUBLIC_CONTACT_ADDRESS="..."
   No code change needed. Redeploy to pick up new values.

B. Hardcode in packages/config-site/src/index.ts:
   SITE.contact.phone = "..."
   SITE.contact.email = "..."
   SITE.contact.address = "..."

Do NOT edit Footer.tsx, privacy-policy/page.tsx, or terms-of-service/page.tsx directly
— they already read from SITE.contact.* via @repo/config-site.
```

---

## 6. Add a new admin domain

Use when extending the admin panel with a new resource type.

```
You are adding a new admin domain "{DOMAIN}" (e.g. "campaigns", "vendors").

Follow the patterns in apps/admin/CLAUDE.md. Specifically:

1. Database
   - Add a Supabase migration in apps/admin/supabase/migrations/ creating the table.
   - DO NOT edit existing migrations.

2. Types
   - Regenerate types: `pnpm -F @repo/db-types gen`

3. Hooks (`apps/admin/src/hooks/`)
   - `use{Domain}List.ts` — search, pagination, delete mutation
   - `use{Domain}Edit.ts` — form state, save mutation
   - Both use PAGE_SIZE=20, useDebounce(300ms), `queryKeys.{domain}.*`

4. Components (`apps/admin/src/components/{domain}/`)
   - `{Domain}List.tsx` — DataTable + DataTablePagination
   - `{Domain}Form.tsx` — React Hook Form + Zod
   - `columns.tsx` — `getColumns({ onDelete })` returning ColumnDef<T>[]
   - `types.ts` — admin-specific Row/Insert types

5. Routes (`apps/admin/src/app/(admin)/{domain}/`)
   - `page.tsx` (list)
   - `[id]/edit/page.tsx`
   - `new/page.tsx`

6. API proxy (`apps/admin/src/app/api/admin/{domain}/`)
   - GET (list with X-Total-Count), POST, PATCH, DELETE
   - Use service_role Supabase client

7. Sidebar
   - Add a new nav item in `apps/admin/src/components/layout/Sidebar.tsx`

Run `pnpm preflight` after all changes.
```

---

## 7. Reskin homepage hero

Use when the client wants a different first-fold experience.

```
You are reskinning the homepage hero for the active site.

Files in scope (only):
- apps/frontend/src/components/home/StaticBanner.tsx (current static hero)
- apps/frontend/src/components/home/RotatingPromoBanner.tsx (rotating banner)
- apps/frontend/src/components/home/SectionTitle.tsx (homepage section titles)
- apps/frontend/public/banners/ (any new image assets)

Constraints:
- DO NOT change apps/frontend/src/app/page.tsx data fetching (Supabase queries).
- DO NOT change the banner_messages table schema in admin.
- All copy MUST stay in Mongolian unless this rebrand is for a non-Mongolian client.
- Use @repo/config-site for any brand-specific tagline (do not hardcode).

Output the visual change plan (sections, layouts, animations) before writing code.
```

---

## 8. Migrate to a new Supabase project

Use when carving the client off into their own Supabase backend.

```
You are migrating the active site to a fresh Supabase project.

Steps:

1. Create the new Supabase project. Note the project ID.

2. Apply all existing migrations:
   cd apps/admin
   supabase link --project-ref {NEW_PROJECT_ID}
   supabase db push

3. Regenerate types:
   SUPABASE_PROJECT_ID={NEW_PROJECT_ID} pnpm -F @repo/db-types gen

4. The above writes packages/db-types/src/database.ts. Until Phase 3 of the refactor
   plan completes, ALSO copy this file into:
   - apps/frontend/src/types/database.ts
   - apps/admin/src/types/database.ts

5. Update env vars in both apps:
   NEXT_PUBLIC_SUPABASE_URL=https://{NEW_PROJECT_ID}.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-dashboard>
   SUPABASE_SERVICE_ROLE_KEY=<from-dashboard, admin only>

6. Update apps/frontend/next.config.ts remotePatterns — the Supabase host is now
   {NEW_PROJECT_ID}.supabase.co (auto-derived from NEXT_PUBLIC_SUPABASE_URL if set).

7. Seed the database (optional):
   psql <connection-string> -f apps/admin/supabase/seed_articles.sql

Verify by running `pnpm dev` and checking that products load on the homepage.
```

---

## Output verification template

After ANY rebrand prompt, run this verification block:

```bash
# 1. Format & lint must be clean
pnpm format:check
pnpm lint

# 2. No hard-coded brand leakage
git grep -i "monpang" -- ':!docs/' ':!packages/config-brand/' ':!packages/config-site/' ':!CLAUDE.md' ':!*.md'
# ^ Must return ZERO results

# 3. Type check (warning: pre-existing errors will surface)
pnpm type-check

# 4. Builds succeed
pnpm build

# 5. Local smoke test
pnpm dev
# Open localhost:3000 and localhost:3001/login
```
