-- ============================================================================
-- WAREHOUSES RLS POLICY
-- warehouses table-д зөв RLS тохиргоо хийнэ
-- ============================================================================

-- 1. Хуучин policy устгах
DROP POLICY IF EXISTS "warehouses_select" ON warehouses;
DROP POLICY IF EXISTS "warehouses_insert" ON warehouses;
DROP POLICY IF EXISTS "warehouses_update" ON warehouses;
DROP POLICY IF EXISTS "warehouses_delete" ON warehouses;

-- 2. RLS идэвхжүүлэх
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- 3. Policy үүсгэхгүй
-- warehouses нь admin-only table тул anon/authenticated хандах шаардлагагүй
-- service_role key (createAdminClient) RLS-г бүрэн тойрч гарна

-- 4. service_role-д table permission олгох
GRANT ALL ON warehouses TO service_role;

SELECT 'Warehouses RLS тохируулагдлаа!' as message;
