-- Add missing columns to categories table
-- The frontend expects these columns but they were never added to the schema

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Generate unique slugs for existing categories
-- Appends row_number to duplicates to avoid conflicts
UPDATE categories SET slug = sub.unique_slug
FROM (
  SELECT id,
    CASE
      WHEN cnt > 1 THEN base_slug || '-' || rn::text
      ELSE base_slug
    END AS unique_slug
  FROM (
    SELECT id,
      LOWER(REPLACE(name, ' ', '-')) AS base_slug,
      ROW_NUMBER() OVER (PARTITION BY LOWER(REPLACE(name, ' ', '-')) ORDER BY id) AS rn,
      COUNT(*) OVER (PARTITION BY LOWER(REPLACE(name, ' ', '-'))) AS cnt
    FROM categories
  ) numbered
) sub
WHERE categories.id = sub.id AND categories.slug IS NULL;

-- Now add the unique constraint (skip if already exists)
DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ============================================================================
-- Add missing columns to products table
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sku VARCHAR,
  ADD COLUMN IF NOT EXISTS barcode VARCHAR,
  ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Migrate existing discount_price to compare_at_price
UPDATE products SET compare_at_price = discount_price WHERE discount_price IS NOT NULL AND compare_at_price IS NULL;

-- Migrate existing status enum to is_active boolean
UPDATE products SET is_active = (status = 'active') WHERE is_active IS NULL;

-- Migrate stock from inventory table
UPDATE products SET stock_quantity = inventory.stock_quantity
FROM inventory
WHERE products.id = inventory.product_id AND products.stock_quantity = 0;

-- Migrate category_id from product_categories junction table (use first category)
UPDATE products SET category_id = pc.category_id
FROM (
  SELECT DISTINCT ON (product_id) product_id, category_id
  FROM product_categories
  ORDER BY product_id
) pc
WHERE products.id = pc.product_id AND products.category_id IS NULL;

-- Migrate images from product_images table (aggregate into array)
UPDATE products SET images = sub.image_urls
FROM (
  SELECT product_id, ARRAY_AGG(url ORDER BY sort_order, id) AS image_urls
  FROM product_images
  GROUP BY product_id
) sub
WHERE products.id = sub.product_id AND (products.images = '{}' OR products.images IS NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
