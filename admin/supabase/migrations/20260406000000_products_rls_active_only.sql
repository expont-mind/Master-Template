-- ============================================================================
-- Restrict products RLS: anon can only see active products
--
-- Previously: USING (true) — allowed anyone to read ALL products.
-- Now:
--   anon:          USING (is_active = true)
--   authenticated: USING (true) — needed for order detail joins
--                  (order_items → products) where products may be deactivated
--
-- Application-level queries already filter .eq("is_active", true) everywhere,
-- but this adds defense-in-depth at the database level.
-- ============================================================================

-- 1. One-time data sync: ensure is_active matches status
UPDATE products SET is_active = (status = 'active')
WHERE is_active != (status = 'active');

-- 2. Replace the permissive policy with role-based policies
DROP POLICY IF EXISTS "products_select" ON products;

-- Anonymous users: only active products
CREATE POLICY "products_select_anon" ON products
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated users: all products (needed for order history product joins)
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT TO authenticated
  USING (true);
