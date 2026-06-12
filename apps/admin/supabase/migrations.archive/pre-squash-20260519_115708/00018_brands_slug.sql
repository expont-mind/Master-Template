-- ============================================================================
-- MIGRATION: brands table-д slug, banner_image нэмэх
-- ============================================================================

-- slug column нэмэх
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;

-- banner_image column нэмэх
ALTER TABLE brands ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- type column нэмэх (beauty, salon гэх мэт)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS type VARCHAR;

-- Одоо байгаа brand-уудын slug-ийг name-ээс автоматаар үүсгэх
UPDATE brands
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM(name),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s]+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- slug index нэмэх
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- category_id column устгах (хэрэггүй)
ALTER TABLE brands DROP COLUMN IF EXISTS category_id;

-- type index нэмэх
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands(type);
