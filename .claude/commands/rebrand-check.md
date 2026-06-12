---
description: Verify the current rebrand state — runs format, lint, type-check, test, build, and brand-leakage scan
---

Run the rebrand verification checklist on the current branch state.
Do NOT make any edits — only verify and report.

Communicate in Mongolian.

## Pipeline

Run each command in order. Stop at the first failure and report the
specific error context:

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Brand leakage scan

If `rebrand.config.yaml` exists, extract `brand.name`. Otherwise default to
checking for "Monpang".

Run:

```bash
git grep -i "monpang" -- ':!docs/' ':!packages/config-brand/' ':!packages/config-site/' ':!CLAUDE.md' ':!README.md' ':!**/*.md' ':!packages/db-types/' ':!**/*.svg' ':!**/MonpangBig.tsx' ':!**/MonpangSmall.tsx'
```

## Design coverage gate

If `rebrand.config.yaml` exists AND its `design:` block is set (not `~`):

1. Read `docs/rebrand/redesign-manifest.json`. Every core route
   (`app/page.tsx`, `app/products/(list)/page.tsx`,
   `app/products/[slug]/page.tsx`, `app/cart/page.tsx`,
   `app/checkout/page.tsx`) must have `"status": "redesigned"`.
   Missing manifest or missing routes → BLOCKED.
2. Theme wiring:
   `grep -c '@repo/theme/brand.css' apps/frontend/src/app/globals.css` → 1.
3. Raw hex utilities:
   `grep -roE '(bg|text|border)-\[#[0-9a-fA-F]{3,8}\]' apps/frontend/src` → empty.

## Asset audit

Quickly stat the brand asset files and report state:

- `apps/frontend/public/logo.svg` — exists? customized?
- `apps/frontend/public/favicon.ico`
- `apps/frontend/public/og-image.png`
- `apps/admin/public/logo.svg`

## Report format

```
=== Rebrand verification ({brand.name}) ===

Format          : ✓ / ✗ ({details})
Lint            : ✓ N errors, M warnings
Type-check      : ✓ / ✗
Tests           : ✓ X passed
Build           : ✓ frontend, ✓ admin
Brand leakage   : ✓ 0 hits / ✗ N hits
Page redesign   : ✓ N/5 core routes / — (design skipped) / ✗ N/5
Бүх хуудас      : N/20 redesigned (үлдсэнийг /redesign-ээр зурна)
Theme wiring    : ✓ @repo/theme imported / ✗ not imported

Asset state     :
  - logo.svg            : default / customized
  - favicon.ico         : default / customized
  - og-image.png        : default / customized
  - admin/logo.svg      : default / customized

Verdict         : 🟢 READY TO DEPLOY / 🔴 BLOCKED

If BLOCKED, the failing items are listed above.
```
