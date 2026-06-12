---
description: Rebrand the master template for a new client end-to-end (reads rebrand.config.yaml)
---

You are executing the **end-to-end rebrand workflow** for this e-commerce
master template. Your goal is to take the values in `rebrand.config.yaml` and
apply them across the codebase, then verify everything still builds clean.

Communicate progress in **Mongolian** (the project default), but keep code
comments in English.

# Step 0 — Preflight

1.  Read `rebrand.config.yaml` from the repo root.
2.  If the file does NOT exist, STOP and tell the user (in Mongolian):
    "rebrand.config.yaml олдсонгүй. Шинээр бөглөхийн тулд:

        /rebrand-init    ← Claude асуулт асууж тус бүрд хариулна (~5 мин)

    эсвэл гар аргаар:

        cp rebrand.config.example.yaml rebrand.config.yaml
        # editor-аар бөглөөд /rebrand-ыг дахин ажиллуул."

3.  Parse the YAML. Validate that every field in the example file is present
    and non-empty (except those marked `~`/null which are intentional).
4.  If validation fails, list the missing/invalid fields and STOP.
5.  Verify hex colors are 6-character `#RRGGBB` format.
6.  Verify URLs start with `https://`.
7.  Verify the phone is in `+976 NNNN-NNNN` shape.
8.  If `auth:` is present, verify `auth.method` is `phone` or `email`.
    (`phone` requires an SMS provider configured in the client's Supabase
    project — remind the user in the final report.)

Print a one-line confirmation like:
"✓ Config OK — {brand.name}, {social.instagram or '—'}, {N} payments, {N} features enabled"

# Step 1 — Config + Theme

Edit these two files using the config values:

**`packages/config-site/src/index.ts`** — update the `SITE` constant fields:

- `brand` block: `name`, `shortName`, `url`, `adminUrl`, `description`,
  `authorName` (= brand.name)
- `contact` block: all fields from config
- `social` block: keep `null` for `~`/missing
- `payments` block: each toggle from config
- `features` block: each toggle from config
- `delivery.freeShippingThreshold`: from config
- `legal` block: all fields from config

**`packages/theme/src/brand.css`** — update CSS variables under `:root`:

- `--color-brand-primary: {theme.primary}`
- `--color-brand-primary-hover: {theme.primaryHover}`
- `--color-brand-primary-active: {theme.primaryActive}`
- `--color-brand-primary-foreground: {theme.primaryForeground}`
- `--color-brand-secondary: {theme.secondary}`
- `--color-brand-secondary-foreground: {theme.secondaryForeground}`
- `--color-brand-accent: {theme.accent}`
- `--color-brand-accent-foreground: {theme.accentForeground}`

Leave semantic neutrals (`--color-text-*`, `--color-surface`, `--color-border`,
`--color-status-*`) UNCHANGED.

**DO NOT touch:**

- `packages/config-brand/` (lower-level; `config-site` composes it)
- Any `apps/frontend/**` or `apps/admin/**` source files (exception: the
  `layout.tsx` / `globals.css` edits that Step 1.5 explicitly authorizes,
  and the Step 4.5 page redesigns)
- Business logic, components, hooks, stores, Supabase clients

After editing, run `pnpm format` quietly and continue. If format fails, stop
and report.

# Step 1.5 — Design token layer

This step only sets **design tokens** (fonts, radius, shadow, spacing, color
mode). It does NOT redesign any page — page-level redesign is Step 4.5, which
is MANDATORY for the core routes whenever `design:` is set. Steps 1–2 are the
_identity rebrand_ (names, colors, config); they are prerequisites to — never
substitutes for — the visual redesign.

If `design:` block in config is `~`/null, **skip this step entirely** — the
user opted to keep the inherited Monpang visual language.

If `design:` is set, apply the token values mechanically:

## 1.5a Typography

Update `apps/frontend/src/app/layout.tsx` (and `apps/admin/src/app/layout.tsx`):

- Replace `next/font/google` imports with the user's chosen `design.typography.heading`
  and `design.typography.body` Google Fonts.
- Update `--font-heading` and `--font-body` CSS variables on `<html>`.

Update `packages/theme/src/brand.css`:

```css
:root {
  --font-heading: var(--font-{headingSlug}), system-ui, sans-serif;
  --font-body: var(--font-{bodySlug}), system-ui, sans-serif;
  --font-mono: var(--font-{monoSlug}), ui-monospace, monospace; /* if mono set */
}
```

There is NO `tailwind.config.ts` — both apps use Tailwind v4 (CSS-first
config). Instead, update the `@theme inline` block in
`apps/frontend/src/app/globals.css` (and admin's `globals.css`) so font
utilities resolve to the new variables:

```css
@theme inline {
  --font-sans: var(--font-body);
  --font-heading: var(--font-heading);
  --font-mono: var(--font-mono);
}
```

## 1.5b Button shape (radius)

Add to `packages/theme/src/brand.css`:

```css
:root {
  --radius-button: {buttonShapeValue};   /* 0 / 4px / 8px / 12px / 9999px */
  --radius-card: calc(var(--radius-button) + 4px);
  --radius-modal: calc(var(--radius-button) + 8px);
}
```

Mapping:

- `sharp` → `0`
- `rounded-sm` → `4px`
- `rounded-md` → `8px`
- `rounded-lg` → `12px`
- `pill` → `9999px`

## 1.5c Component vibe (shadow)

Add to `packages/theme/src/brand.css`:

```css
:root {
  --shadow-card: {shadowValue};
  --shadow-modal: {shadowValueStronger};
}
```

Mapping:

- `flat` → `none` / `none`
- `soft` → `0 1px 3px rgba(0,0,0,0.08)` / `0 4px 12px rgba(0,0,0,0.12)`
- `heavy` → `0 4px 16px rgba(0,0,0,0.16)` / `0 10px 32px rgba(0,0,0,0.24)`
- `glass` → `0 8px 32px rgba(31,38,135,0.15), inset 0 1px 1px rgba(255,255,255,0.5)`
  - add `backdrop-filter: blur(12px)` to `.card-base` class

## 1.5d Density (spacing scale)

Add to `packages/theme/src/brand.css`:

```css
:root {
  --space-section: {sectionPadding};
  --space-card: {cardPadding};
  --space-gap: {gapBase};
}
```

Mapping:

- `compact` → section: 24px, card: 12px, gap: 8px
- `comfortable` → section: 48px, card: 20px, gap: 16px (default — matches current)
- `spacious` → section: 96px, card: 32px, gap: 24px

## 1.5e Default color mode

The dark wiring lives in two places: `packages/theme/src/brand.css` defines
the `html.dark { … }` token overrides (per-client tunable defaults), and
`apps/frontend/src/app/globals.css` binds the `dark:` variant to the `.dark`
class via `@custom-variant dark`. This step only chooses how the class is
applied.

Update `apps/frontend/src/app/layout.tsx` `<html>` element:

- `light` → no change (default; `.dark` absent, all dark styling inert)
- `dark` → add `dark` to the `<html>` className
- `auto` → add a small inline script in `<head>` that reads
  `prefers-color-scheme` and toggles `.dark` before first paint

Then review the `html.dark` token values in `packages/theme/src/brand.css`
against the client palette — they are sensible inversions, not derived from
`theme.*`, so a dark-first brand should hand-tune them.

## 1.5f Studio reference scan

For each URL in `design.references`, fetch its homepage HTML via WebFetch
and extract the following hints (record them as inline comments in `brand.css`
for the user to verify):

- Primary color used most (look for repeated hex codes)
- Typography hierarchy (look for h1/h2/h3 font sizes)
- Section padding (look at `<main>` or wrapper padding)
- Button border-radius (look at `<button>` CSS)

DO NOT auto-apply scanned values — only annotate so the user knows where
the AI's suggestions came from.

After this step, run `pnpm format` and `pnpm type-check`. If anything fails,
stop and report.

# Step 2 — Hardcoded brand leakage scan

Run these searches:

```
git grep -i "monpang"
git grep -i "монпан"
```

For each hit, classify:

- **A) Bug** — hardcoded brand string in user-facing UI (component JSX text,
  meta tags, alt text, page copy)
- **B) Acceptable** — comments, docs, identifiers (SVG component names like
  `MonpangBig`), fallback defaults in `@repo/config-brand`

Output the bug list as a numbered Mongolian-narrated review:
"Дараах хатуу шивэгдсэн Monpang reference олдлоо. Засах эсэх?"

Then FOR EACH bug, apply the fix using the new brand name. SVG component
file names (`MonpangBig.tsx`) — leave the filename alone; if the file
contains hardcoded brand text inside, only update the text content.

# Step 3 — Brand assets audit

Check the existence and basic shape of:

- `apps/frontend/public/logo.svg`
- `apps/frontend/public/favicon.ico`
- `apps/frontend/public/og-image.png`
- `apps/admin/public/logo.svg`

For each file:

- If the file is the **default Monpang asset** (check by file size or modify
  timestamp matching the initial template commit), report:
  "{path} — Monpang-ийн default асsetтай байна. Client-ийн файлаар сольно уу."
- If the file already looks customized, report: "{path} ✓"

DO NOT edit binary asset files yourself — only audit.

Output a manual replacement command for the user to run after they receive
the client's assets, e.g.:

```bash
cp ~/Downloads/{client}-logo.svg apps/frontend/public/logo.svg
cp ~/Downloads/{client}-logo.svg apps/admin/public/logo.svg
cp ~/Downloads/{client}-favicon.ico apps/frontend/public/favicon.ico
cp ~/Downloads/{client}-og.png apps/frontend/public/og-image.png
```

# Step 4 — Generate .env.local skeletons

For each of `apps/frontend/.env.local` and `apps/admin/.env.local`:

- If file exists, READ it and only OVERWRITE the `NEXT_PUBLIC_*` keys
  derivable from `rebrand.config.yaml`. Leave secret keys
  (`SUPABASE_SERVICE_ROLE_KEY`, `QUICKPAY_API_KEY`, etc.) alone.
- Config-derived keys include `NEXT_PUBLIC_AUTH_METHOD={auth.method}` and
  the feature flags (`NEXT_PUBLIC_FEATURE_REVIEWS`,
  `NEXT_PUBLIC_FEATURE_NOTIFICATIONS`, …) for any feature set to `false`.
- If file does not exist, copy from `.env.example`, then fill the
  `NEXT_PUBLIC_*` config-derived keys with values from the config.

After writing, list the still-empty secret keys per app so the user knows
what to fill in manually:

```
=== apps/frontend/.env.local ===
SECRETS to fill (manual):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - QUICKPAY_API_KEY  (if qpay enabled)
  - ...
```

# Step 4.5 — Core-route layout redesign (MANDATORY when `design:` is set)

If `design:` block is `~`/null, **skip this step**.

If `design:` is set, this step is NOT optional. The user chose option (a) in
`/rebrand-init` — "rebrand нь font/color/layout-ийг шинээр зурна" — so
shipping the Monpang page structure is a FAILURE, not a smaller success.

CORE_ROUTES (non-skippable, redesigned in this order, no opt-out):

```
1. apps/frontend/src/app/page.tsx                   (home)
2. apps/frontend/src/app/products/(list)/page.tsx   (product listing)
3. apps/frontend/src/app/products/[slug]/page.tsx   (product detail)
4. apps/frontend/src/app/cart/page.tsx              (cart)
5. apps/frontend/src/app/checkout/page.tsx          (checkout)
```

The procedure is owned by the standalone `/redesign` skill — follow
`.claude/commands/redesign.md` exactly:

1. **Step 1 (Design spec):** create or reuse `docs/rebrand/design-spec.md`
   (reference distillation — single design source).
2. **Step 3 (Per-route procedure):** run it for each CORE route — pin the
   business-logic contract, rewrite JSX from the spec, re-attach verbatim,
   type-check, update `docs/rebrand/redesign-manifest.json` after every
   route.
3. Its hard rules (no business-logic edits, no Mongolian translation, no
   Monpang signatures, no raw hex) apply verbatim.

Do NOT run redesign.md Step 2's route selection here — the core set is
fixed and mandatory. Secondary pages (profile, wishlist, search, brands,
events, articles, faq, legal — 15 routes) are NOT part of /rebrand: after
Step 6 the report tells the user to run `/redesign` for them.

# Step 5 — Final verification

Run the full verification pipeline in this exact order. Stop at the FIRST
failure and report the specific error.

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Then run the brand leakage final check:

```
git grep -i "monpang" -- ':!docs/' ':!packages/config-brand/' ':!packages/config-site/' ':!CLAUDE.md' ':!README.md' ':!**/*.md' ':!packages/db-types/' ':!**/*.svg' ':!**/MonpangBig.tsx' ':!**/MonpangSmall.tsx'
```

This MUST return zero results outside SVG identifiers.

Then run the **design coverage gate** (only when `design:` is set):

1. Read `docs/rebrand/redesign-manifest.json`. Every CORE route from Step
   4.5 MUST have `"status": "redesigned"`. If any core route is missing or
   not redesigned, the rebrand FAILS — report exactly which routes still
   ship the Monpang layout. Do not proceed to a 🎉 report.
2. Theme wiring intact:
   `grep -c '@repo/theme/brand.css' apps/frontend/src/app/globals.css` → 1.
3. No raw-hex utility classes introduced by the redesign:
   `grep -roE '(bg|text|border)-\[#[0-9a-fA-F]{3,8}\]' apps/frontend/src` → empty.

# Step 6 — Final report

Output a structured summary in Mongolian:

```
🎉 Rebrand дууссан: {brand.name}

✓ Config + Theme        (config-site + brand.css)
{designSkipped ? '— Design tokens        (skipped — config.design = ~)' :
'✓ Design tokens        (typography {h}+{b}, radius {r}, shadow {s})'}
{designSkipped ? '— Page redesign        (skipped — config.design = ~)' :
'✓ Page redesign        ({N} of 5 core routes)'}
{!designSkipped ? perRouteStatusLines : ''}
✓ Hardcoded scan        (N bugs fixed)
✓ Asset audit           (M assets need manual replacement)
✓ Env vars              (K secrets need manual fill)
✓ Final verification    (format/lint/type-check/test/build all green)

📋 Дараа хийх алхамууд (хүний ажил):
  1. Үлдсэн 15 хуудсыг шинээр зурахдаа:  /redesign   ← manifest-ээс
     үргэлжлүүлнэ, тасалдсан ч дахин ажиллуулахад болно (design сонгосон үед л)
  2. Client-ийн asset файлуудыг хуулах (Step 3-ийн команд)
  3. apps/frontend/.env.local + apps/admin/.env.local-д secrets бөглөх
  4. Supabase project үүсгээд migration push (apps/admin/supabase)
  5. Vercel-д 2 project үүсгээд env vars copy
  6. DNS-руу домэйн заах
  7. docs/CUSTOMIZATION_CHECKLIST.md-ийн manual smoke test
```

If ANY step failed — **including the Step 5 design coverage gate (any core
route not redesigned while `design:` is set)** — instead output:

```
✗ Rebrand тулд алдаа гарлаа

Файл: {file}
Алхам: {step}
Алдаа: {error message}

Засах санал: {suggested fix}
```

# Important rules

- **Never commit** changes. The user will review and commit themselves.
- **Never push** to remote.
- **Never edit** business logic, Supabase clients, payment integrations.
- **Always verify** after each step — if `pnpm build` fails, stop.
- Speak Mongolian to the user; keep code comments English.
- If any field in config is ambiguous, ASK the user before guessing.
