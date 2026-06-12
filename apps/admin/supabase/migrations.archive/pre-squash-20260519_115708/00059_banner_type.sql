-- Add type column to banners table to distinguish carousel vs promo banners
-- type: 'carousel' (default) for main carousel, 'promo' for promotional banners shown below categories

ALTER TABLE banners ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'carousel'
  CHECK (type IN ('carousel', 'promo'));

-- Add index for efficient type filtering
CREATE INDEX IF NOT EXISTS idx_banners_type ON banners(type);

-- Add comment for documentation
COMMENT ON COLUMN banners.type IS 'Banner type: carousel (main slider) or promo (promotional banner in page)';
