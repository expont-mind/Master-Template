-- Supplements 20260416100000_add_performance_indexes.sql
-- Target: mobile launch on 2026-04-19 caused 131s banners query timeouts.
-- Uses CREATE INDEX CONCURRENTLY to avoid blocking production writes.
-- Each statement runs outside a transaction (Supabase SQL Editor runs
-- each statement in its own implicit transaction).

-- 1) Banners: the 131s offender.
--    Partial composite on (type, sort_order) WHERE is_active = true
--    covers all 3 mobile home queries (carousel/promo/small) + web carousel.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banners_active_type_sort
  ON banners (type, sort_order)
  WHERE is_active = true;

-- 2) Products list/home: is_active + created_at DESC.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created
  ON products (created_at DESC)
  WHERE is_active = true;

-- 3) Category filtering via junction table.
--    products.category_id was dropped in 00030_remove_redundant_product_columns.sql.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_categories_category
  ON product_categories (category_id, product_id);

-- 4) Order history composite.
--    Existing idx_orders_user_id is single-column; composite wins for
--    ORDER BY created_at DESC paginated queries.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- Note: admins.email is already UNIQUE NOT NULL → Postgres auto-creates
-- a btree index for the UNIQUE constraint, so idx_admins_email is redundant.
