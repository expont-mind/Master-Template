# Supabase Audit & Cleanup

Audit conducted 2026-05-13. **Cleanup actions for edge functions + seed
files have been APPLIED.** Migration squash is deferred until a working
source DB is available.

---

## ✅ Edge functions — cleaned up

**Active functions** (kept in `apps/admin/supabase/functions/`):

| Function                 | Why it stayed                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `check-pending-invoices` | Invoked by Supabase pg_cron every 5 min — see migration `00044_schedule_pending_invoice_check.sql` |
| `send-push-notification` | Invoked by DB triggers on order/notification inserts                                               |
| `_shared/`               | Utilities (logger) imported by the two active functions                                            |

**Archived functions** (moved to `apps/admin/supabase/functions.archive/`):

| Function                  | Replaced by                                                                       | Reason                                                                        |
| ------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `check-payment-status`    | `apps/frontend/src/components/checkout/actions/payment-status.ts` (Server Action) | Server Action is invoked from `usePaymentPolling.ts` every 5s during checkout |
| `create-checkout-invoice` | `apps/frontend/src/components/checkout/actions/invoice.ts` (Server Action)        | Server Action wraps QPay/LendMN/StorePay invoice creation                     |
| `qpay-callback`           | `apps/frontend/src/app/api/checkout/callback/route.ts`                            | Next.js webhook handler — point QPay merchant dashboard at this URL           |
| `lendmn-callback`         | `apps/frontend/src/app/api/checkout/lendmn-callback/route.ts`                     | Next.js webhook handler                                                       |
| `lendmn-debit`            | `apps/frontend/src/lib/lendmn/client.ts` (direct API call)                        | Server-side TS module runs on Vercel serverless                               |
| `storepay-debit`          | `apps/frontend/src/lib/storepay/client.ts`                                        | Server-side TS module                                                         |
| `send-sms`                | _none — was not in use_                                                           | If SMS needed later, build a Server Action calling Skytel/Callpro             |

To restore an archived function:

```bash
git mv apps/admin/supabase/functions.archive/<name> apps/admin/supabase/functions/<name>
```

See `apps/admin/supabase/functions.archive/README.md` for the full restore
instructions and the rationale for each archive.

---

## ✅ Seed files — reorganized

Moved from `apps/admin/supabase/*.sql` → `apps/admin/supabase/seeds/*.sql`:

| File                      | What it contains          | When to use          |
| ------------------------- | ------------------------- | -------------------- |
| `seeds/seed_articles.sql` | ~10 demo articles         | QA / UI walkthrough  |
| `seeds/seed_faqs.sql`     | ~20 demo FAQs (Mongolian) | QA / starter content |
| `seeds/seed_orders.sql`   | ~30 mock orders           | Admin dashboard QA   |
| `seeds/seed_reviews.sql`  | ~50 mock reviews          | Product page QA      |

**Production rule:** Do not run seeds on a live client database. They
insert mock data tied to placeholder user IDs.

The `/supabase-setup` slash command asks per-client whether to apply seeds.

See `apps/admin/supabase/seeds/README.md` for application order + manual
instructions.

---

## ✅ Migrations — squashed via concatenation

**Status (2026-05-13):** Squashed without a live source DB by concatenating
all 141 original migration files into a single `00001_initial_schema.sql`.

|                     | Before | After                                                           |
| ------------------- | ------ | --------------------------------------------------------------- |
| Files               | 141    | 1                                                               |
| Lines               | 13,261 | ~13,715 (extras are section markers showing original filenames) |
| `pnpm db push` time | ~5 min | ~30 sec                                                         |

**Two changes applied during the squash:**

1. **`CREATE INDEX CONCURRENTLY` → `CREATE INDEX`** — Fresh databases don't
   need concurrency-safe index creation, and the CONCURRENTLY variant cannot
   run inside the single transaction that `supabase db push` uses.
2. **`apply_product_details.sql` was excluded** — it was a hand-applied SQL
   Editor patch with no number prefix. Its content is superseded by
   `00022_product_details.sql` and `00023_update_save_product_details.sql`.

**Originals archived to:** `apps/admin/supabase/migrations.archive/pre-squash-2026-05-13/`
(includes `_manifest.txt` listing all 141 files and a README explaining the
restore procedure).

**Why this is "concatenation" not "true squash":**

- True squash would be `supabase db dump` against a live DB, producing
  cleaner SQL with no `create-then-alter-then-drop` patterns (e.g. dropping
  columns that earlier migrations added).
- We don't have a live source DB in the master template repo. Concatenation
  reaches the same final schema state by replaying the migrations as one
  big SQL file.

**When to graduate to true squash:**

1. After your **first client deploy** succeeds end-to-end (you'll have a
   verified, clean schema in that client's Supabase project).
2. Run `/supabase-squash` in Claude Code against that linked project.
3. The true-dump output replaces today's concatenated `00001_initial_schema.sql`
   with a cleaner `pg_dump`-based version (~3,000 lines instead of 13,715).
4. Commit the result back to the master template repo.

See `.claude/commands/supabase-squash.md` for the squash workflow details.

---

## TL;DR

| What           | Status                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Edge functions | ✅ 7 archived, 2 active (`check-pending-invoices`, `send-push-notification`)                          |
| Seed files     | ✅ Moved to `apps/admin/supabase/seeds/`                                                              |
| Migrations     | ✅ Squashed via concatenation (141 → 1 file). True `pg_dump` squash deferred until first live client. |
