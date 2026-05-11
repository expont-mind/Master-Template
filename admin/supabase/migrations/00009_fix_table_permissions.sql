-- ============================================================================
-- TABLE PERMISSION FIX
-- service_role key-д бүх table-д бүрэн хандах эрх олгоно
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant ALL on all tables to service_role (bypasses RLS anyway, but needs table permission)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant SELECT on catalog tables to anon (public read)
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON brands TO anon;
GRANT SELECT ON product_categories TO anon;
GRANT SELECT ON inventory TO anon;
GRANT SELECT ON product_attributes TO anon;
GRANT SELECT ON product_attribute_values TO anon;
GRANT SELECT ON product_attribute_configs TO anon;
GRANT SELECT ON product_variants TO anon;
GRANT SELECT ON product_variant_attributes TO anon;
GRANT SELECT ON product_images TO anon;
GRANT SELECT ON banners TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON coupons TO anon;
GRANT SELECT ON delivery_zones TO anon;
GRANT SELECT ON bank_accounts TO anon;
GRANT SELECT ON about_sections TO anon;
GRANT SELECT ON team_members TO anon;
GRANT SELECT ON settings TO anon;
GRANT SELECT ON articles TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON reviews TO anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
