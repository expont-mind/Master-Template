---
description: Redesign page layouts from the design direction in rebrand.config.yaml — all routes or a subset, resumable via the redesign manifest
---

You are executing the **page-redesign workflow**. It rewrites page layouts
from the `design:` block of `rebrand.config.yaml` while preserving every
piece of business logic. It is resumable: progress is tracked per-route in
`docs/rebrand/redesign-manifest.json`, so an interrupted session continues
where it left off.

This skill owns the **canonical per-route redesign procedure** (Step 3).
`/rebrand` Step 4.5 runs the same procedure for the core routes — keep the
two in sync by editing it HERE only.

**Required companion skill:** invoke the `ui-ux-pro-max` skill (Skill tool)
at the start of every /redesign run. It supplies the style/palette/font
intelligence used in Steps 1 and 3 below. If it is not installed
(`.claude/skills/ui-ux-pro-max/`), warn the user (`npx uipro-cli init --ai
claude`) and proceed with reduced design intelligence.

Communicate progress in **Mongolian**; keep code comments in English.

Arguments: `--force` redoes routes already marked `"redesigned"`; any other
argument is treated as a route filter (e.g. `/redesign cart checkout`).

# Step 0 — Preflight

1. Read `rebrand.config.yaml` from the repo root.
   - If missing → STOP: "rebrand.config.yaml олдсонгүй. Эхлээд /rebrand-init
     ажиллуул."
   - If `design:` is `~`/null → STOP: "config-д design тодорхойлогдоогүй
     байна. /rebrand-init ажиллуулж дизайны чиглэлээ сонго (option a)."
2. Read `docs/rebrand/redesign-manifest.json` if it exists (else treat as
   empty). Each entry: `{ "route": "<app-relative path>", "status":
"redesigned" | "kept" | "skipped" }`.
3. Run `pnpm -F @monpang/frontend type-check` once — if the tree is already
   broken, STOP and report (redesign on a red tree hides its own breakage).

# Step 1 — Design spec (the single design source)

If `docs/rebrand/design-spec.md` exists, READ it and use it as-is — do not
improvise directions that contradict it. (If the user explicitly wants a new
direction, tell them to update `rebrand.config.yaml` and delete the spec so
this step regenerates it.)

If it does not exist, distill it now:

1. **Consult `ui-ux-pro-max` first:** from `design.aesthetic`, pick the
   closest of its 67 styles and note that style's layout patterns, spacing
   philosophy, and component vibe; pick a font pairing consistent with
   `design.typography`. Do NOT take colors from its palettes — brand colors
   are already fixed in `packages/theme/src/brand.css` and must win.
2. For each `design.references[].url`: WebFetch the page. From the fetched
   structure plus that reference's `take`, the `aesthetic`, `density`, and
   `componentVibe` — cross-checked against the ui-ux-pro-max style notes —
   write a **layout-language spec** covering:

- hero treatment (full-bleed / split / framed; image-to-text ratio)
- section order and rhythm (what follows what; spacing cadence)
- grid language (column counts, card aspect, gutter feel)
- card composition (image placement, text hierarchy, price treatment)
- CTA placement and weight
- navigation chrome (header density, footer structure)

Persist to `docs/rebrand/design-spec.md` with one section per route (group
similar routes: e.g. listing-style pages share a section). Running this
skill twice with the same config must produce structurally equivalent
results.

# Step 2 — Route inventory & selection

The full route set of the storefront (`apps/frontend/src/app/`):

```
CORE (the 5 routes /rebrand redesigns mandatorily):
  1. page.tsx                     (нүүр)
  2. products/(list)/page.tsx     (жагсаалт)
  3. products/[slug]/page.tsx     (дэлгэрэнгүй)
  4. cart/page.tsx                (сагс)
  5. checkout/page.tsx            (checkout)

SECONDARY:
  6.  profile/page.tsx            13. brands/page.tsx
  7.  wishlist/page.tsx           14. brands/[slug]/page.tsx
  8.  search/page.tsx             15. events/page.tsx
  9.  best-sellers/page.tsx       16. events/[slug]/page.tsx
  10. new-arrivals/page.tsx       17. articles/page.tsx
  11. faq/page.tsx                18. articles/[slug]/page.tsx
  12. data-deletion/page.tsx      19. privacy-policy/page.tsx
                                  20. terms-of-service/page.tsx
```

1. Cross off routes already `"redesigned"` in the manifest (unless
   `--force`). If a route filter argument was given, keep only matches.
2. Present the remaining list and ask via AskUserQuestion (multiSelect):
   "Аль хуудсуудыг шинээр зурах вэ?" — default selection = **all
   remaining**. Routes the user unchecks get `"status": "kept"` in the
   manifest (a deliberate decision, distinct from never-attempted).
3. Order the work: core routes first, then secondary.

# Step 3 — Per-route redesign procedure (canonical)

For each selected route, in order:

1. **Read** the page file and its direct section components.
2. **Pin the business-logic contract** — write an explicit must-preserve list:
   - data fetching (server Supabase queries, useQuery/useInfiniteQuery)
   - state (useState / Zustand selectors) and effects
   - event handlers (onClick / onSubmit / onChange) and their wiring
   - routing (Link hrefs, router.push — keep `ROUTES.*` usage)
   - auth gates, loading / empty / error states
   - every Mongolian string, verbatim
3. **Rewrite the JSX from the design-spec section for this route**:
   - apply `ui-ux-pro-max` guidance for the chosen style: layout patterns,
     element composition (navbar/card/form/modal), spacing, hover/shadow
     treatment — within the spec, not instead of it
   - compose existing primitives (`@/components/ui/Button`, `Card`, `Modal`,
     typography components) — they already carry the design tokens
   - introduce new layout primitives (e.g. `_HeroSplitLayout.tsx`) rather
     than monkey-patching old ones
   - use only semantic token utilities (`bg-brand-primary`,
     `text-text-secondary`, …) — NEVER raw hex classes (ESLint rejects them)
   - never re-introduce Monpang signatures (1064px max-width container,
     Manrope-only typography, the rose-accent layout language)
4. **Re-attach the pinned contract verbatim** — same hooks, same handlers,
   same strings, same gates.
5. **Review with `ui-ux-pro-max`** — run its review checklist on the
   rewritten page (accessibility, spacing rhythm, responsive behavior,
   visual hierarchy) and fix what it flags.
6. **Verify**: `pnpm -F @monpang/frontend type-check` passes.
7. **Update the manifest immediately** (this is what makes the run
   resumable): set this route's entry to `"status": "redesigned"`. Write the
   file after EVERY route, not at the end.

## Hard rules during redesign

- **NEVER** touch the business logic (data fetching, mutations, state).
- **NEVER** translate Mongolian UI text — keep all `"Захиалга"`, `"Сагс"` strings.
- **NEVER** alter `createOrderAfterPayment()` semantics (idempotent) or the
  cart store's `loadFromServer()` empty-result guard.
- **REUSE** existing primitives — they already match the design tokens.
- **DO** keep accessibility intact: alt text, button labels, focus order.

# Step 4 — Final verification & report

```bash
pnpm -F @monpang/frontend lint
pnpm -F @monpang/frontend type-check
pnpm turbo build --filter=@monpang/frontend --force
```

Stop at the first failure and report it. Then output (Mongolian):

```
🎨 Redesign дууссан

Core хуудас      : {n}/5 redesigned
Бусад хуудас     : {m}/15 redesigned ({k} kept, {j} хараахан зураагүй)
Энэ session-д    : {list of routes done now}

Үлдсэн хуудас зурахдаа /redesign-ийг дахин ажиллуул — manifest-ээс
үргэлжлүүлнэ.
```

# Important rules

- **Never commit** — the user reviews and commits.
- The manifest + design-spec are checked by `/rebrand` Step 5 and
  `/rebrand-check` — do not change their formats without updating those.
