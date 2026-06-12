-- Add button_text column and remove unused columns from banners table
-- Keep category_id and product_id for optional relations

-- Drop policy that depends on columns we're removing
DROP POLICY IF EXISTS "banners_select_active" ON banners;

-- Add new column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_text VARCHAR(100);

-- Remove only truly unused columns (keep category_id, product_id, sort_order)
ALTER TABLE banners DROP COLUMN IF EXISTS mobile_image_url;
ALTER TABLE banners DROP COLUMN IF EXISTS link_type;
ALTER TABLE banners DROP COLUMN IF EXISTS start_date;
ALTER TABLE banners DROP COLUMN IF EXISTS end_date;

-- Recreate policy without date checks
CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (is_active = true);
 