-- Simplify banner schema to match frontend static banner component
-- Add variant field and remove analytics fields
-- Keep category_id and product_id as optional relations

-- 1. Update any existing banners with null descriptions to empty string
UPDATE banners SET description = '' WHERE description IS NULL;

-- 2. Make description required (not nullable)
ALTER TABLE banners
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '';

-- 3. Add variant field (rose | blue)
ALTER TABLE banners
  ADD COLUMN variant VARCHAR(10) NOT NULL DEFAULT 'rose'
  CHECK (variant IN ('rose', 'blue'));

-- 4. Remove unused fields (keep category_id and product_id)
ALTER TABLE banners
  DROP COLUMN IF EXISTS link_url,
  DROP COLUMN IF EXISTS button_text,
  DROP COLUMN IF EXISTS click_count,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS position;
