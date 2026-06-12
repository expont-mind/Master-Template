# Master Template — Monorepo Conventions

This is a **reusable e-commerce master template** built on Next.js + Supabase. The repo is duplicated per client, then rebranded via configuration + AI prompts. See [docs/TEMPLATE_SETUP.md](docs/TEMPLATE_SETUP.md) for the duplication workflow and [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md) for ready-to-use rebrand prompts.

## Workspace Layout

```
apps/
├── frontend/   @monpang/frontend   Customer storefront (Next.js, port 3000)
└── admin/      @monpang/admin      Admin panel (Next.js, port 3001)
packages/
├── config-brand/    @repo/config-brand  BRAND, LOCALE, DELIVERY_ZONES_CONFIG
├── config-site/     @repo/config-site   SITE — full client config (contact, social, payments, features, legal)
├── theme/           @repo/theme         CSS variable design tokens (brand.css + tokens.css)
├── ui-utils/        @repo/ui-utils      cn, formatters (formatPrice, formatPhone, ...), image-compression
├── supabase/        @repo/supabase      Browser/server/admin client factories + middleware helpers
├── db-types/        @repo/db-types      Supabase-generated Database types (Phase 3: merged superset planned)
├── logger/          @repo/logger        Structured logger facade
├── eslint-config/   @repo/eslint-config Shared ESLint config (next + strict variant)
└── tsconfig/        @repo/tsconfig      Shared TypeScript presets (base / nextjs / library / strict)
```

## Package Manager & Tooling

- **pnpm 10+** with workspaces (`packageManager` field locks the version).
- **Turborepo 2+** for cached builds.
- **Prettier 3** for formatting (config at `.prettierrc`).
- **Husky 9** runs `lint-staged` (pre-commit) + `commitlint` (commit-msg).
- **Commitlint** enforces Conventional Commits — see `commitlint.config.cjs`.

## Common Commands

```bash
pnpm install                          # Install all workspace deps
pnpm dev                              # Run both apps in parallel
pnpm frontend dev                     # Frontend only (port 3000)
pnpm admin dev                        # Admin only (port 3001)
pnpm build                            # Build both apps (turbo-cached)
pnpm turbo build --filter=@monpang/frontend  # Build one app
pnpm lint                             # Lint everything
pnpm format                           # Prettier write
pnpm type-check                       # tsc --noEmit across workspaces
pnpm preflight                        # format:check + lint + type-check + build
pnpm test                             # Run all package unit tests (Vitest)
pnpm -F @repo/ui-utils test           # Run tests in one package
pnpm -F @repo/db-types gen            # Regenerate Supabase types from remote schema
```

## Testing

Unit tests live next to source as `*.test.ts` and run via Vitest. The
`@repo/ui-utils` package is the canonical example — see
[packages/ui-utils/src/formatters.test.ts](packages/ui-utils/src/formatters.test.ts).

To add tests to a new package:

```bash
# 1. Add vitest as a devDep + test scripts to package.json
pnpm -F @repo/<package> add -D vitest

# 2. Create a minimal vitest.config.ts (copy from packages/ui-utils)

# 3. Write src/*.test.ts files
```

Apps (`@monpang/frontend`, `@monpang/admin`) do not yet have Vitest configured
because the cart/checkout/order flows depend on Supabase + Next.js routing
which require a more involved test setup (jsdom + mocked clients). The
package-level tests cover the pure logic shared across both apps.

## Customization (per-client) — Single source of truth

When this template is duplicated for a new client, edit ONLY these files:

| What changes per client                                         | File                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Brand identity, contact, social, legal, feature flags, payments | `packages/config-site/src/index.ts` (re-exports `@repo/config-brand`) |
| Theme colors, fonts, radius                                     | `packages/theme/src/brand.css`                                        |
| Logo assets, favicon, OG image                                  | `apps/frontend/public/`, `apps/admin/public/`                         |
| Environment vars (Supabase, payment providers, SMS, email)      | `.env.local` per app                                                  |

**Do not** hardcode brand-specific values in components — always import from `@repo/config-site` or `@repo/config-brand`. ESLint will eventually enforce this via custom rules.

## Code Quality Rules

- **TypeScript strict mode** is on (`@repo/tsconfig/base.json`). The `strict.json` preset adds `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitReturns` — apps can opt in once existing violations are cleaned up (Phase 5 in the migration plan).
- **ESLint** has two configs: baseline (`@repo/eslint-config/next`) and strict (`@repo/eslint-config/strict` with `no-console`, `jsx-a11y/*`, `import/order`, `no-relative-import-paths`, etc.). Both also load `design-tokens.mjs` (bans raw-hex/rgba utility classes everywhere and `transition-all` in layout chrome); the frontend additionally opts into the ROUTES-factory rule via `designTokenConfigs({ routeFactory: true })`. The frontend uses strict; admin still uses strict with known Phase-4 size-limit debt.
- **Prettier** is the only formatter — no stylistic ESLint rules.
- **Conventional Commits** are enforced via commitlint. Format: `type(scope): subject` (e.g. `feat(checkout): add free-shipping coupon`). Allowed types: feat, fix, refactor, perf, docs, style, test, build, ci, chore, revert.

## Hard Rules for AI Agents (inherited from frontend/CLAUDE.md)

- **Mongolian UI text:** All user-facing labels and error messages are in Mongolian. Do NOT translate them. If i18n is needed, raise it as a separate task.
- **Customization via @repo/config-site:** Brand-specific strings live in `packages/config-site/src/index.ts`. Do not hardcode them elsewhere.
- **Payment idempotency:** `createOrderAfterPayment()` in `apps/frontend/src/components/checkout/actions.ts` is idempotent — preserve this semantic in any refactor.
- **Cart race-condition guard:** `loadFromServer()` in `apps/frontend/src/stores/cart-store.ts` MUST refuse empty server result when local has items. Do not "simplify" this.
- **Database migrations:** Never write or modify Supabase migrations during feature work or refactors.
- **Service role secrets:** Never import `@/lib/supabase/admin` or `createAdminClient` from a `"use client"` file — the service-role key must not bundle into client-side JavaScript.
- **Feature-flag gating:** every optional subsystem's ENTRY component self-gates with the wrapper/inner split (`if (!SITE.features.X) return null;` in a wrapper before any hook runs — see `Reviews.tsx`, `NotificationPanel.tsx`), and its query hooks add the flag to `enabled:`. Call sites carry NO flag guards (a call-site condition is acceptable only to suppress wrapper layout spacing, with a comment saying so).
- **Design tokens:** never write raw-hex Tailwind classes (`text-[#020617]`) — ESLint errors on them. Use the semantic utilities wired to `packages/theme/src/brand.css` (`text-text-primary`, `bg-brand-primary`, `border-border`, …). New colors get a token in brand.css + tokens.css first.

## App-specific Conventions

Each app has its own CLAUDE.md with detailed conventions:

- [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) — data fetching strategy, cart/checkout flow, payment providers, pricing logic
- [apps/admin/CLAUDE.md](apps/admin/CLAUDE.md) — API proxy pattern, DataTable pattern, hook pattern

## Vercel Deployment

Each app deploys as a separate Vercel project:

- **Frontend**: Root Directory = `apps/frontend`, Build Command = `cd ../.. && pnpm turbo build --filter=@monpang/frontend`
- **Admin**: Root Directory = `apps/admin`, Build Command = `cd ../.. && pnpm turbo build --filter=@monpang/admin`
- Both: Install Command = `pnpm install`. Region = `sin1` (Singapore).
- Set `TURBO_TOKEN` + `TURBO_TEAM` env vars to enable Turborepo remote cache.

## Phase Status (from refactor plan)

- ✅ Phase 0: Pre-flight cleanup (lockfiles, version alignment)
- ✅ Phase 1: Turborepo monorepo migration (8 shared packages)
- ✅ Phase 2: Code quality tooling (Prettier, Husky, lint-staged, commitlint)
- ✅ Phase 3: Customization infrastructure foundation (config-site, theme, Footer/Privacy/Terms extracted)
- ⏳ Phase 4: Component decomposition (5 monoliths — AddToCartModal, PaymentModal, ProductDetailClient, cart/page, useProductEdit)
- ⏳ Phase 5: Cleanup (a11y alt-text, remove commented code, edge-function logger migration, relative→@/ imports, pre-existing type errors)
- ✅ Phase 6: AI agent documentation (this file + TEMPLATE_SETUP + AI_PROMPTS)
