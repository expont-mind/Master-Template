# Template Setup — Duplicating for a New Client

This guide walks through the steps to spin up a new e-commerce site from this master template for a specific client (call them "Acme").

## Time estimate

- **Minimum viable rebrand** (config + assets + colors + Supabase): **~30 minutes**
- **Full deployment with payment providers + DNS**: **~2 hours**

## Prerequisites

- Node.js 20+
- pnpm 10+ (or `corepack enable` to use the version pinned in `package.json`)
- A Supabase project for the client (free tier works for development)
- Vercel account for deployment

---

## Step 1 — Duplicate the repo

```bash
# Option A: GitHub template (if marked as template repo)
gh repo create acme-shop --template <org>/master-project --private --clone

# Option B: Clone + reset remote
git clone <master-project-url> acme-shop
cd acme-shop
git remote set-url origin <new-client-repo-url>
```

Then install dependencies:

```bash
pnpm install
```

---

## Step 2 — Configure Supabase

1. Create a new Supabase project at <https://supabase.com/dashboard>.
2. Run the migrations from `apps/admin/supabase/migrations/` against the new project (use `supabase db push` or the SQL editor).
3. (Optional) Seed demo data: `apps/admin/supabase/seed_articles.sql`, `seed_orders.sql`, etc.
4. Regenerate database types so they match the new project:

```bash
SUPABASE_PROJECT_ID=<new-project-id> pnpm -F @repo/db-types gen
```

5. Copy the project URL + anon key + service role key into `.env.local` (see Step 5).

---

## Step 3 — Rebrand the site config

Open `packages/config-site/src/index.ts` and update each section:

```ts
export const SITE = {
  contact: {
    phone: "+976 9999-9999", // ← Acme's phone
    email: "info@acme.mn", // ← Acme's email
    address: "Acme HQ, Khan-Uul, ...", // ← Acme's address
  },
  social: {
    instagram: "acme.mn",
    facebook: "acme.shop",
    youtube: null,
    tiktok: "@acme.shop",
  },
  delivery: {
    zones: { capital: "Улаанбаатар", rural: "Орон нутаг" },
    freeShippingThreshold: 80000, // ← Acme's threshold
  },
  payments: {
    qpay: true,
    lendmn: false, // ← Toggle providers
    storepay: true,
    transfer: true,
  },
  legal: {
    jurisdiction: "Mongolia",
    privacyEmail: "privacy@acme.mn",
  },
  // ...
};
```

For most fields you can also use environment variables (preferred for secrets and per-environment values) — see comments in `index.ts`.

---

## Step 4 — Rebrand the theme

Open `packages/theme/src/brand.css` and update the brand color tokens:

```css
:root {
  --color-brand-primary: #0066cc; /* ← Acme's primary brand color */
  --color-brand-primary-hover: #0052a3;
  --color-brand-primary-active: #003d7a;
  --color-brand-secondary: #1a1a1a;
  --color-brand-accent: #ff6b00;
  /* Semantic neutrals usually stay unchanged */
}
```

For more drastic theme work (typography, radius scale, custom variants) edit `packages/theme/src/tokens.css` as well.

---

## Step 5 — Brand assets

Replace these files with Acme's branding:

| Path                                | What                                               |
| ----------------------------------- | -------------------------------------------------- |
| `apps/frontend/public/logo.svg`     | Header logo (used by `<MonpangBig />` and similar) |
| `apps/frontend/public/favicon.ico`  | Browser tab icon                                   |
| `apps/frontend/public/og-image.png` | Open Graph preview image (1200×630)                |
| `apps/admin/public/logo.svg`        | Admin panel logo                                   |

If your SVG component imports point at `MonpangBig`, also rename or replace those SVG components in `apps/frontend/src/components/svg/`.

---

## Step 6 — Environment variables

Copy `.env.example` to `.env.local` in **both** `apps/frontend/` and `apps/admin/`:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/admin/.env.example   apps/admin/.env.local
```

Then fill in:

**Required (both apps):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # admin only — never in frontend
NEXT_PUBLIC_BRAND_NAME=Acme
NEXT_PUBLIC_SITE_URL=https://acme.mn
NEXT_PUBLIC_ADMIN_URL=https://admin.acme.mn
```

**Contact info (frontend) — overrides `SITE.contact.*`:**

```bash
NEXT_PUBLIC_CONTACT_PHONE=+976 9999-9999
NEXT_PUBLIC_CONTACT_EMAIL=info@acme.mn
NEXT_PUBLIC_CONTACT_ADDRESS=...
```

**Payment providers (only set what you enable in `SITE.payments`):**

```bash
QUICKPAY_API_URL=...
QUICKPAY_API_KEY=...
QUICKPAY_MERCHANT_ID=...
LENDMN_API_URL=...
LENDMN_CLIENT_ID=...
LENDMN_CLIENT_SECRET=...
STOREPAY_API_URL=...
```

**Optional integrations:**

```bash
UPSTASH_REDIS_REST_URL=...              # Server-side caching
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_GOOGLE_VERIFICATION=...     # Google Search Console
NEXT_PUBLIC_META_PIXEL_ID=...           # Meta Ads
NEXT_PUBLIC_GTM_ID=...                  # Google Tag Manager
```

---

## Step 7 — Verify locally

```bash
pnpm preflight    # format:check + lint + type-check + build
pnpm dev          # Both apps in parallel
```

Open <http://localhost:3000> (frontend) and <http://localhost:3001/login> (admin). You should see:

- ✅ Acme's brand colors (no Monpang pink)
- ✅ Acme's contact info in the Footer
- ✅ Acme's name in the page title and OG metadata
- ✅ Logo, favicon, OG image replaced

If anything still shows "Monpang", run `git grep -i "monpang"` to find missed references. Anything matching outside `packages/config-brand/`, `packages/config-site/`, `docs/`, or `CLAUDE.md` files is a bug — open an issue.

---

## Step 8 — Deploy to Vercel

Create **two** Vercel projects (one per app):

### Frontend project

- **Repository**: your Acme repo
- **Root Directory**: `apps/frontend`
- **Framework Preset**: Next.js
- **Build Command**: `cd ../.. && pnpm turbo build --filter=@monpang/frontend`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next` (default)
- **Environment Variables**: same as `apps/frontend/.env.local`

### Admin project

- **Repository**: your Acme repo
- **Root Directory**: `apps/admin`
- **Build Command**: `cd ../.. && pnpm turbo build --filter=@monpang/admin`
- **Install Command**: `pnpm install`
- **Environment Variables**: same as `apps/admin/.env.local` (including `SUPABASE_SERVICE_ROLE_KEY`)

### Turborepo remote cache

In **both** projects, also add:

```bash
TURBO_TOKEN=<from-vercel-team-settings>
TURBO_TEAM=<your-team-slug>
```

This enables shared build cache across deploys and CI.

### DNS

Point the client's domain at Vercel:

- `acme.mn` → frontend project
- `admin.acme.mn` → admin project

---

## Step 9 — Smoke test in production

After the first preview deploy, walk through the happy path:

1. **Frontend**: Home → search → product → add to cart → checkout → payment QR shows up
2. **Admin**: login with the seeded admin email → see Dashboard → Products list paginates
3. **OG preview**: paste the production URL into a Slack/Discord message, check the preview image
4. **SEO**: view-source on the homepage, confirm `<title>`, `<meta name="description">`, and structured data show Acme's brand

---

## Common gotchas

| Problem                                    | Fix                                                                                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand still says "Monpang" in some places  | The `@repo/config-site` fallback kicks in when an env var is missing. Either set the env var or update `packages/config-site/src/index.ts` defaults.                                                          |
| Supabase queries return `never` types      | Old `apps/<app>/src/types/database.ts` is divergent from the new Supabase project. Regenerate with `pnpm -F @repo/db-types gen` and re-copy into the app's local `types/database.ts`.                         |
| `pre-commit` hook fails                    | Run `pnpm lint:fix && pnpm format` and try again.                                                                                                                                                             |
| Vercel build "Cannot find module @repo/\*" | The Build Command must `cd ../..` before `pnpm install` so the lockfile at repo root resolves workspace packages.                                                                                             |
| Type errors during build                   | The original codebase has some pre-existing type errors (see Phase 5 in the refactor plan). Apps still build via `next build`'s Turbopack despite this — but they will become a hard gate once Phase 5 lands. |

---

## Reference: AI prompts for rebranding

See [AI_PROMPTS.md](AI_PROMPTS.md) for ready-to-paste prompts that walk an AI agent through the rebrand workflow.
