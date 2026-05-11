-- ============================================================================
-- ARTICLES IMPROVEMENTS
-- Add image_url, type, and is_featured fields for rich article content
-- ============================================================================

-- Add new columns
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured) WHERE is_featured = TRUE;

-- ============================================================================
-- DONE!
-- ============================================================================
