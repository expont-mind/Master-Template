-- Add mobile_image_url column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

-- Add mobile_background_color column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_background_color TEXT;

-- Add comments for documentation
COMMENT ON COLUMN banners.mobile_image_url IS 'Mobile-specific banner image URL';
COMMENT ON COLUMN banners.mobile_background_color IS 'Mobile-specific background color';
