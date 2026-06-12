-- Add link_url column for custom banner links
ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN banners.link_url IS 'Custom URL for banner link (alternative to category_id/product_id)';
