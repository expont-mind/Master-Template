-- iOS binary schema-compat hotfix for 2026-04-19 production outage.
--
-- The App Store iOS binary that went live this morning was built from an
-- older codebase commit and sends queries the current production schema
-- rejects, returning HTTP 400 from PostgREST in tight loops. That gateway
-- traffic saturated the PostgREST tier, preventing web/admin auth requests
-- from getting through, even after the banners-storm DB CPU issue was
-- resolved by 20260419000000_banners_mobile_storm_indexes.sql.
--
-- All four patches below are purely additive — no existing reader breaks,
-- no data is moved, no table is rewritten.
--
-- IMPORTANT: The ALTER TYPE ... ADD VALUE statement cannot run inside a
-- transaction block. When applying via `supabase db push` (or any tool
-- that wraps the whole file in a BEGIN/COMMIT), split this file and run
-- the enum change separately, e.g.:
--
--   psql -c "ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'approved';"
--
-- then apply the rest of this file. Applied live on 2026-04-19 via
-- individual execute_sql calls.

-- 1) product_variants.description
--
-- Originally dropped in 00039_remove_unused_variant_columns.sql. The
-- deployed iOS binary still selects this column. Re-adding it as a
-- nullable, no-default column does not rewrite the table; mobile reads
-- NULL, which the binary's model tolerates.
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN product_variants.description IS
  'Nullable placeholder re-added on 2026-04-19 for iOS binary compat. '
  'Older mobile builds select this column; current local mobile code '
  'does not. Keep nullable until all clients are on a build that omits '
  'it, then drop again.';

-- 2) review_status enum: add 'approved'.
--
-- Must be run outside a transaction. See file-level IMPORTANT note above.
-- The deployed iOS binary filters reviews with status=eq.approved, but
-- the enum was defined in 00001_complete_schema.sql as ('active','hidden',
-- 'flagged'). Adding 'approved' is additive; no existing row uses it.
-- Mobile queries will return 0 rows (reviews feature effectively hidden
-- on the deployed binary) but stop 400-ing against PostgREST.
ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'approved';

-- 3) app_config: grant SELECT to anon.
--
-- The "Public read access" RLS policy on app_config already grants SELECT
-- to both anon and authenticated. But RLS policies sit on top of table-
-- level GRANTs: without GRANT SELECT to anon, PostgREST returns "permission
-- denied for table app_config" before the policy can run. Mobile reads
-- app_config on every launch for force-update checks, so this was a
-- high-volume 400 source.
GRANT SELECT ON TABLE app_config TO anon;

-- 4) search_logs: grant SELECT + INSERT to anon.
--
-- Same RLS-without-GRANT root cause as app_config. The existing policies
-- ("Anyone can log searches" for INSERT, "Allow public read access to
-- search_logs" for SELECT) already cover both operations for anon, but
-- table-level GRANTs were missing. Mobile inserts on every search (for
-- trending) and reads when displaying trending suggestions.
GRANT SELECT, INSERT ON TABLE search_logs TO anon;
