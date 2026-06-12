# Customization Checklist — Per-client Sign-off

Run through this checklist before declaring a new client deployment ready. Mark each item ✅ when complete.

## Brand identity

- [ ] `packages/config-site/src/index.ts` — `SITE.brand.name`, `shortName`, `url` updated
- [ ] `packages/config-site/src/index.ts` — `SITE.contact.{phone,email,address}` updated
- [ ] `packages/config-site/src/index.ts` — `SITE.social.{instagram,facebook,youtube,tiktok}` set or nulled
- [ ] `packages/config-site/src/index.ts` — `SITE.legal.{jurisdiction,privacyEmail,companyRegistration}` updated
- [ ] Footer, Privacy Policy, Terms of Service render the new info correctly

## Theme & assets

- [ ] `packages/theme/src/brand.css` — `--color-brand-primary` + hover/active variants set
- [ ] `packages/theme/src/brand.css` — `--color-brand-secondary` set
- [ ] `packages/theme/src/brand.css` — `--color-brand-accent` set
- [ ] `apps/frontend/public/logo.svg` replaced
- [ ] `apps/frontend/public/favicon.ico` replaced
- [ ] `apps/frontend/public/og-image.png` replaced (1200×630, < 1MB)
- [ ] `apps/admin/public/logo.svg` replaced
- [ ] No "Monpang" string in any rendered UI surface (run `git grep -i monpang` outside docs/config)

## Supabase backend

- [ ] New Supabase project created
- [ ] Migrations applied (`supabase db push`)
- [ ] Types regenerated (`pnpm -F @repo/db-types gen`)
- [ ] Auth providers configured (email + OAuth if needed)
- [ ] Storage buckets created (`product-images`, `category-images`, `articles`)
- [ ] RLS policies verified

## Environment variables

### Frontend (`apps/frontend/.env.local` + Vercel project)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_BRAND_NAME`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_ADMIN_URL`
- [ ] `NEXT_PUBLIC_CONTACT_PHONE` (if not hardcoding in config-site)
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` (if not hardcoding in config-site)
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (for caching)
- [ ] Payment provider keys (only for enabled providers):
  - [ ] `QUICKPAY_*` (5 vars)
  - [ ] `LENDMN_*` (4 vars)
  - [ ] `STOREPAY_*` (4 vars)

### Admin (`apps/admin/.env.local` + Vercel project)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ← **server-only, never in frontend**
- [ ] `SMTP_*` (4 vars) for transactional emails
- [ ] `SKYTEL_API_KEY` or `CALLPRO_API_KEY` for SMS

## Payments

- [ ] `SITE.payments.{qpay,lendmn,storepay,transfer}` toggled correctly
- [ ] Each enabled provider's credentials added to env vars
- [ ] QPay webhook URL configured: `https://{site-url}/api/checkout/callback`
- [ ] LendMN callback URL configured: `https://{site-url}/api/checkout/lendmn-callback`
- [ ] Test transaction completed end-to-end in each enabled provider's sandbox

## Vercel deployment

- [ ] Two Vercel projects created (frontend + admin)
- [ ] Root Directory set correctly per project
- [ ] Build Command set: `cd ../.. && pnpm turbo build --filter=<name>`
- [ ] Install Command set: `pnpm install`
- [ ] Region set: `sin1` (or client-preferred region)
- [ ] `TURBO_TOKEN` + `TURBO_TEAM` env vars set in both projects
- [ ] Preview deploy succeeds on a feature branch
- [ ] Production deploy on `main` succeeds
- [ ] DNS configured for primary domain + admin subdomain

## SEO & metadata

- [ ] OG image renders correctly on Slack/Twitter/Facebook link previews
- [ ] `<title>` and `<meta name="description">` show client brand on homepage
- [ ] Structured data (JSON-LD) shows client brand
- [ ] Google Search Console verification: `NEXT_PUBLIC_GOOGLE_VERIFICATION` set
- [ ] Sitemap.xml generated and accessible
- [ ] Robots.txt accessible

## Code quality gates

- [ ] `pnpm format:check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds in both apps
- [ ] No new ESLint disable comments introduced by the rebrand
- [ ] CHANGELOG.md updated with rebrand notes

## Smoke tests (production preview URL)

### Frontend

- [ ] Homepage loads, shows client products
- [ ] Search returns results
- [ ] Product detail page loads, variants selectable
- [ ] Add to cart works, count badge updates
- [ ] Checkout: address form, payment method picker, invoice creation
- [ ] Login/register via email
- [ ] OAuth login (Google/Apple) if enabled
- [ ] Mobile viewport: header, footer, cart drawer all responsive

### Admin

- [ ] Login works with seeded admin email
- [ ] Dashboard renders (revenue charts, top-selling products)
- [ ] Product list paginates, search works
- [ ] Create product → variants + images → save → appears in frontend list
- [ ] Order list paginates, search by order number works
- [ ] Edit product details, upload images
- [ ] User list paginates

## Handoff to client

- [ ] Admin login credentials shared securely (1Password / shared vault)
- [ ] Vercel project access granted to client's account
- [ ] Supabase project ownership transferred (or service account credentials shared)
- [ ] Domain DNS access confirmed
- [ ] Client trained on admin panel basics (15-30 min walkthrough)
- [ ] Repo access granted to client developer team (if applicable)
