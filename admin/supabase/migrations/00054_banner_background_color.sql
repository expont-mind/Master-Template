-- Replace title, description, variant with background_color
-- Banner now only needs image and background color

-- 1. Add background_color column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) NOT NULL DEFAULT '#ffffff';

-- 2. Drop unused columns
ALTER TABLE banners
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS variant;

-- Add comment for documentation
COMMENT ON COLUMN banners.background_color IS 'Background color for the banner (hex format, e.g. #ffffff)';
