ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_is_featured ON categories(is_featured);
