-- ============================================================================
-- PRODUCT DETAILS TABLE (product_id-аар холбогдсон)
-- product_variant_details-ийг product_details болгон шилжүүлэх
-- ============================================================================

-- 1. Шинэ table үүсгэх
CREATE TABLE IF NOT EXISTS product_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_details_product_id
  ON product_details(product_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_details ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
DROP POLICY IF EXISTS "product_details_select" ON product_details;
CREATE POLICY "product_details_select" ON product_details
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_details TO service_role;

-- 6. Хуучин өгөгдлийг шилжүүлэх (product_variant_details -> product_details)
INSERT INTO product_details (product_id, type, content, sort_order, created_at)
SELECT DISTINCT ON (pv.product_id, pvd.type)
  pv.product_id,
  pvd.type,
  pvd.content,
  pvd.sort_order,
  pvd.created_at
FROM product_variant_details pvd
JOIN product_variants pv ON pv.id = pvd.variant_id
WHERE pv.is_default = true
ON CONFLICT DO NOTHING;

-- 7. Хуучин table устгах
DROP TABLE IF EXISTS product_variant_details;

SELECT 'product_details table үүсгэгдэж, product_variant_details устгагдлаа!' as message;
