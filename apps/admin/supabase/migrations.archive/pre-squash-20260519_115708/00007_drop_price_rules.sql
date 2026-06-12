-- ============================================================================
-- DROP PRICE RULES
-- ============================================================================

-- Drop RLS policies
DROP POLICY IF EXISTS "price_rule_categories_delete" ON price_rule_categories;
DROP POLICY IF EXISTS "price_rule_categories_insert" ON price_rule_categories;
DROP POLICY IF EXISTS "price_rule_categories_select" ON price_rule_categories;

DROP POLICY IF EXISTS "price_rule_products_delete" ON price_rule_products;
DROP POLICY IF EXISTS "price_rule_products_insert" ON price_rule_products;
DROP POLICY IF EXISTS "price_rule_products_select" ON price_rule_products;

DROP POLICY IF EXISTS "price_rules_delete" ON price_rules;
DROP POLICY IF EXISTS "price_rules_update" ON price_rules;
DROP POLICY IF EXISTS "price_rules_insert" ON price_rules;
DROP POLICY IF EXISTS "price_rules_select" ON price_rules;

-- Drop tables (junction tables first due to FK)
DROP TABLE IF EXISTS price_rule_categories;
DROP TABLE IF EXISTS price_rule_products;
DROP TABLE IF EXISTS price_rules;

-- Drop enum types
DROP TYPE IF EXISTS price_rule_scope;
DROP TYPE IF EXISTS price_rule_type;
