-- ============================================================================
-- PRODUCT RICH DESCRIPTIONS TABLE
-- Дэлгэрэнгүй тайлбар (текст + зураг) хадгалах тусдаа хүснэгт
-- ============================================================================

-- 1. Шинэ table үүсгэх
CREATE TABLE IF NOT EXISTS product_rich_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content TEXT,  -- Rich text content
  images TEXT[] DEFAULT '{}',  -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)  -- Нэг product-д нэг л rich description
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_rich_descriptions_product_id
  ON product_rich_descriptions(product_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_rich_descriptions ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
DROP POLICY IF EXISTS "product_rich_descriptions_select" ON product_rich_descriptions;
CREATE POLICY "product_rich_descriptions_select" ON product_rich_descriptions
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_rich_descriptions TO service_role;

-- 6. anon role-д унших эрх
GRANT SELECT ON product_rich_descriptions TO anon;

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_product_rich_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_rich_descriptions_updated_at ON product_rich_descriptions;
CREATE TRIGGER trigger_product_rich_descriptions_updated_at
  BEFORE UPDATE ON product_rich_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rich_descriptions_updated_at();

-- 8. Хуучин product_details-ээс шилжүүлэх (хэрэв байвал)
INSERT INTO product_rich_descriptions (product_id, content, images)
SELECT
  pd.product_id,
  MAX(CASE WHEN pd.type = 'rich_description' THEN pd.content END) as content,
  ARRAY_AGG(pd.content) FILTER (WHERE pd.type = 'rich_image') as images
FROM product_details pd
WHERE pd.type IN ('rich_description', 'rich_image')
GROUP BY pd.product_id
ON CONFLICT (product_id) DO NOTHING;

-- 9. Хуучин rich_description, rich_image entries устгах
DELETE FROM product_details WHERE type IN ('rich_description', 'rich_image');

SELECT 'product_rich_descriptions table үүсгэгдлээ!' as message;
