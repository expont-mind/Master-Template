# @repo/db-types

Supabase-generated database types shared between `@monpang/frontend` and `@monpang/admin`.

## Current state (Phase 1)

Each app currently maintains its own `src/types/database.ts` file with only the
tables it uses (frontend has `cart_items`, `coupons`, `addresses`...; admin has
`admins`, `inventory`, `warehouses`...). The two files **diverge** because the
schema has grown organically without a unified regen step.

This package today contains an **admin-side snapshot** (1,425 lines) but is
**not yet consumed** by the apps — they still import from their local
`@/types/database`. The package exists as the **future canonical location**.

## Path forward (Phase 2 — when ready)

1. **Configure Supabase CLI** in `apps/admin/supabase/config.toml` with the
   project ID for the active client.
2. **Regen the canonical file**:

   ```bash
   SUPABASE_PROJECT_ID=<id> pnpm -F @repo/db-types gen
   ```

   This writes `src/database.ts` as a true superset of every table in the
   live schema.

3. **Switch apps to import from here**:

   ```ts
   // apps/<app>/src/types/database.ts
   // Replace the 1,400+ line copy with:
   export * from "@repo/db-types";
   ```

4. Delete the per-app `database.ts` content. Single source of truth achieved.

## Why not do it now?

The hand-merge of the two existing files is a 3-4 hour task that gets thrown
away as soon as Phase 2 runs. The apps work today with their local copies, and
the divergence is bounded — tables exist in exactly one app each, never in
both with different shapes.

## Exports today

- `Database` — top-level interface (matches admin's schema)
- `Tables<T>` — table row type helper
- `Insertable<T>` — table insert payload helper
- `Updatable<T>` — table update payload helper
- All enums (`UserStatus`, `OrderStatus`, `PaymentStatus`, ...)
- Domain aliases: `Product`, `Category`, `Order`, `Profile`, `Review`, ...

These can be used today for app-side code that touches only the admin-side
tables. Frontend-only tables (`cart_items`, `coupons`, `addresses`) require
the local `database.ts` for now.
