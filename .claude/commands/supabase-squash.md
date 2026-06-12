---
description: Squash all 141 migrations into a single consolidated schema dump (uses supabase db dump)
---

You are squashing the migration history into a single "initial schema" file
so new clients only have to apply ONE migration instead of 141.

**Important:** This command requires a working source Supabase project that
already has all 141 migrations applied. We dump THAT project's final schema
state and use it as the new initial migration.

Communicate in Mongolian.

# Step 0 — Confirm intent

Ask the user (Mongolian, with serious tone):
"⚠ Анхааруулга: энэ команд apps/admin/supabase/migrations/ дотор байгаа 141
файлыг бүх замаар нь архивлаад НЭГ schema dump-аар орлуулна.

Гэхдээ хэрвээ ажиллах ИДЭВХТЭЙ Supabase project байгаа байх ёстой —
тэрнээс нь dump авах юм. Хэрвээ танд ийм project байхгүй бол /supabase-setup-аар
шинэ project үүсгэгээд 141 migration-ыг push хийгээд (~5 мин) дараа нь
энэ командыг ажиллуул.

Үргэлжлүүлэх үү? (yes / no)"

If `no`, STOP.

# Step 1 — Verify linked project

Run:

```bash
cd apps/admin
npx supabase link --project-ref ?    # Asks if not linked
npx supabase migration list
```

Expect ~141 migrations listed as "applied" (remote column). If fewer, the
project is incomplete — STOP and tell user to first run `/supabase-setup`.

# Step 2 — Backup existing migrations

Create `apps/admin/supabase/migrations.archive/<timestamp>/` and move
ALL files from `apps/admin/supabase/migrations/` into it.

Run via Bash:

```bash
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p apps/admin/supabase/migrations.archive/$TS
mv apps/admin/supabase/migrations/* apps/admin/supabase/migrations.archive/$TS/
```

The archive folder is kept in git (NOT gitignored) so the history is
preserved for reference, but not re-applied to new projects.

# Step 3 — Dump current schema

Run:

```bash
npx supabase db dump --linked --schema public --schema auth -f apps/admin/supabase/migrations/00001_consolidated_schema.sql
```

This produces a clean SQL dump representing the CURRENT state of the public

- auth schemas — all CREATE TABLE, CREATE FUNCTION, CREATE POLICY,
  CREATE INDEX statements combined.

Also dump roles + data if user wants seed-like data:

```bash
npx supabase db dump --linked --data-only -f apps/admin/supabase/migrations/00002_initial_data.sql
```

(Optional — only if user opts in.)

# Step 4 — Validate the dump

The dump should be ~2,000-4,000 lines (vs 13,261 in the original 141 files).

Check that the dump contains expected tables. Run:

```bash
grep -c "CREATE TABLE" apps/admin/supabase/migrations/00001_consolidated_schema.sql
```

Expect ~50 tables. If <30, the dump is incomplete — STOP and investigate.

# Step 5 — Test against a fresh project (CRITICAL)

Tell the user (Mongolian):
"Шинэ Supabase project үүсгээд `supabase db push` ажиллуулж шалгах хэрэгтэй.

1. supabase.com → New project (template testing-ийн зориулалтаар)
2. npx supabase link --project-ref <new-test-ref>
3. npx supabase db push

Хэрвээ алдаагүй ажиллавал squash амжилттай. Алдаа гарвал archive-аас файлуудыг
буцаагаад манай 00001-ийг устгана.

Тестээ хийсэн үү? (yes / restore)"

If user says `restore`, run:

```bash
rm apps/admin/supabase/migrations/00001_consolidated_schema.sql
mv apps/admin/supabase/migrations.archive/<timestamp>/* apps/admin/supabase/migrations/
rmdir apps/admin/supabase/migrations.archive/<timestamp>
```

# Step 6 — Final report

Print (Mongolian):

```
✓ Migration squash дууссан

Өмнө : 141 файл, 13,261 мөр
Одоо : 1 файл, ~3,000 мөр (consolidated_schema.sql)
Архив: apps/admin/supabase/migrations.archive/<timestamp>/

Шинэ client-ийн /supabase-setup одоо 5 минутын оронд ~30 секунд болно.

Git commit зөвлөмж:
  git add apps/admin/supabase/
  git commit -m "chore(db): squash 141 migrations into single schema"
```

# Important rules

- **Only run** if user has a working source Supabase project.
- **Never overwrite** `migrations.archive/` — always create new timestamped folder.
- **Stop on first error** — schema dump is sensitive.
- **Test against fresh project** before committing — corrupt dump = broken template.
