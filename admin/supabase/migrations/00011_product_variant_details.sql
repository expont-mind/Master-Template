-- ============================================================================
-- PRODUCT VARIANT DETAILS TABLE + RLS
-- Variant-д дэлгэрэнгүй тайлбар хадгалах table
-- ============================================================================

-- 1. Table үүсгэх
CREATE TABLE IF NOT EXISTS product_variant_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_variant_details_variant_id
  ON product_variant_details(variant_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_variant_details ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
CREATE POLICY "product_variant_details_select" ON product_variant_details
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_variant_details TO service_role;

SELECT 'product_variant_details table + RLS тохируулагдлаа!' as message;
