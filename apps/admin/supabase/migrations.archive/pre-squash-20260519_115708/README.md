# Pre-squash migration archive — 2026-05-13

These are the **original 141 migration files** from 2025-2026 development.
They have been **concatenated** into `apps/admin/supabase/migrations/00001_initial_schema.sql`
so new client deployments push a single file instead of 141.

## Why archive instead of delete?

- **Git history readability** — easier to inspect "when did we add X?" by
  filename than by scrolling 13K lines.
- **Rollback option** — if the consolidated file has a problem, restore
  these and `supabase db push` works exactly as before.
- **Documentation** — original filenames carry intent (`fix_*`, `update_*`)
  that the concatenated file loses.

## What changed in consolidation

1. **`CREATE INDEX CONCURRENTLY` → `CREATE INDEX`** — Fresh databases have no
   concurrent traffic, so the locking-friendly variant is unnecessary AND
   would force the migration out of a transaction (which `supabase db push`
   doesn't support). On a live client DB, you can add new indexes with
   CONCURRENTLY via Supabase Studio.

2. **`apply_product_details.sql` was skipped** — it was a hand-applied SQL
   Editor patch with no number prefix. Its content has been superseded by
   migrations `00022_product_details.sql` and `00023_update_save_product_details.sql`.

3. **Nothing else.** All other SQL is verbatim from the original files,
   just with section comment headers showing the source filename.

## Manifest

See `_manifest.txt` for the full ordered list of files that were merged.

## Restoring

If the consolidated migration is broken:

```bash
# Wipe the consolidated file
rm apps/admin/supabase/migrations/00001_initial_schema.sql

# Restore the originals
mv apps/admin/supabase/migrations.archive/pre-squash-20260519_115708/*.sql \
   apps/admin/supabase/migrations/
```

Don't forget to also keep the README.md in migrations/.
