---
description: Link a fresh Supabase project, push migrations, deploy edge functions, optionally seed
---

You are guiding the user through setting up a Supabase backend for a new
client deployment. Communicate in Mongolian. Verify each step before moving on.

# Prerequisites

Check that these are installed:

- `supabase` CLI (`npx supabase --version` should work)
- `pnpm`

If not installed, tell user (Mongolian):
"Supabase CLI шаардлагатай. Суулгах: brew install supabase/tap/supabase эсвэл npx supabase ..."

# Step 1 — Get the project reference

Read `rebrand.config.yaml` to derive a suggested project ref from `brand.shortName`.

Ask the user (Mongolian):
"Supabase project аль хэдийн үүсгэсэн үү?

1. Тийм — project ref-ээ дамжуул
2. Үгүй — supabase.com/dashboard дээр шинээр үүсгэгээд project ref-ийг буцааж дамжуулна уу

Project ref нь URL-ийн дунд харагдана: `https://<project-ref>.supabase.co`"

Validate: project ref should be ~20 lowercase alphanumeric chars.

# Step 2 — Link

Run from `apps/admin/supabase/`:

```bash
cd apps/admin
npx supabase link --project-ref <project-ref>
```

If this prompts for a database password, stop and ask the user to enter it
interactively (Supabase CLI handles the prompt).

Verify by checking `apps/admin/.supabase/` was created (or the `linked`
state file).

# Step 3 — Push migrations

Run:

```bash
npx supabase db push
```

This will execute all 141 migrations in `apps/admin/supabase/migrations/`
in order. It takes 2-5 minutes for a fresh project. Watch for errors:

- **"relation already exists"** → migration ran twice. Use `--include-all` cautiously OR check `supabase_migrations.schema_migrations` table.
- **"permission denied"** → service role mismatch. Re-link with the correct ref.
- **"syntax error"** → some migration broke. STOP, report the specific file
  and line.

Report progress to user (Mongolian):
"Migration 1/141 ажиллаж байна..."
(Actually just report the final result.)

# Step 4 — Deploy edge functions

Only TWO functions remain active in the template:

- **check-pending-invoices** (invoked by pg_cron every 5 min — pending QPay/LendMN invoice cleanup)
- **send-push-notification** (invoked by DB triggers on order/notification inserts)

All other functions (qpay-callback, lendmn-callback, storepay-debit,
create-checkout-invoice, check-payment-status, send-sms, lendmn-debit) were
archived to `apps/admin/supabase/functions.archive/` because they duplicate
Next.js Server Actions / API routes that are now the canonical path.

Deploy both active functions:

```bash
npx supabase functions deploy check-pending-invoices
npx supabase functions deploy send-push-notification
```

After deploy, run a sanity check:

```bash
npx supabase functions list
```

Expected output: 2 functions deployed.

After deploy, run a sanity check:

```bash
npx supabase functions list
```

# Step 5 — (Optional) Seed data

Ask user (Mongolian):
"Тест өгөгдлөөр seed хийх үү? (template-ийн mock data — production-д
зориулагдаагүй)

1. articles (~10 нийтлэл)
2. faqs (~20 түгээмэл асуулт)
3. orders (~30 mock захиалга)
4. reviews (~50 mock сэтгэгдэл)

Сонголт (multi, comma-separated, эсвэл 'skip')?"

For each selected, run:

```bash
psql "$(npx supabase status -o json | jq -r .DB_URL)" -f apps/admin/supabase/seeds/seed_<name>.sql
```

If `jq`/`psql` aren't available, paste the contents of each seed file into
Supabase Studio → SQL Editor manually.

Note: Seed files live in `apps/admin/supabase/seeds/` and are NOT applied
automatically by `supabase db push`.

OR if jq/psql aren't available, instruct the user to copy the seed file's
SQL into Supabase Studio's SQL Editor manually.

# Step 6 — Storage buckets

The app expects these buckets to exist:

- `product-images` (public)
- `category-images` (public)
- `brand-logos` (public)
- `articles` (public)
- `banners` (public)
- `user-avatars` (public)

Check if they exist. If not, instruct the user (Mongolian):
"Supabase Dashboard → Storage хэсэгт орж дараах bucket-ыг үүсгэнэ үү (бүгд public):

product-images, category-images, brand-logos, articles, banners, user-avatars"

# Step 7 — Final report

Print (Mongolian):

```
✓ Supabase setup дууссан

Project ref       : <ref>
Migrations        : 141 ажилласан
Edge functions    : X deployed
Seed data         : ✓ articles ✓ faqs ✗ orders ✗ reviews
Storage buckets   : ⚠ Manual setup needed (Supabase Dashboard)

Дараа хийх:
  1. apps/{frontend,admin}/.env.local-руу SUPABASE_URL + anon key + service role-ийг хуул
  2. /rebrand-check-аар бүгдийг verify хий
  3. pnpm dev-аар local-д шалга
```

# Important rules

- **Speak Mongolian** to the user.
- **Never** push to production Supabase project without confirming.
- **Stop on first error** — don't silently skip migrations.
- **Don't** modify `apps/admin/supabase/migrations/` files — only execute them.
- If the user is **re-running** /supabase-setup, detect the already-linked state
  and skip Step 2, jumping straight to push.
