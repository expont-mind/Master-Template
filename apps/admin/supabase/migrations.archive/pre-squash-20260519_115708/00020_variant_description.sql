-- Add description column to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN product_variants.description IS 'Variant specific description';
