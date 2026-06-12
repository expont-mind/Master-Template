# Seed data (optional, for testing only)

These SQL files insert **mock** data into a fresh Supabase project so the
admin UI has something to render during QA.

**Do NOT run these in production.** They reference random user IDs and
will create messy demo content that you don't want in a live store.

## How to apply

The `/supabase-setup` slash command asks whether to apply each seed file.

Manually:

```bash
psql "$(npx supabase status -o json | jq -r .DB_URL)" -f seeds/seed_faqs.sql
```

Or paste the file contents into Supabase Studio → SQL Editor.

## What each seed contains

| File                | Inserts                     |
| ------------------- | --------------------------- |
| `seed_articles.sql` | ~10 example articles        |
| `seed_faqs.sql`     | ~20 sample FAQs (Mongolian) |
| `seed_orders.sql`   | ~30 mock orders with items  |
| `seed_reviews.sql`  | ~50 mock product reviews    |

## Order matters

If you want all 4, apply in this order:

1. `seed_faqs.sql` (no dependencies)
2. `seed_articles.sql` (no dependencies)
3. `seed_orders.sql` (requires products + users)
4. `seed_reviews.sql` (requires products + users)
