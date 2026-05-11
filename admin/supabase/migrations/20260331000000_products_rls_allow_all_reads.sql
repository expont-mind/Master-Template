-- Allow reading ALL products regardless of status
-- Inactive products are already filtered at application level (.eq("is_active", true))
-- This fix ensures order details can display product info for inactive/draft products

DROP POLICY IF EXISTS "products_select" ON products;

CREATE POLICY "products_select" ON products
  FOR SELECT USING (true);
