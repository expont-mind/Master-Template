-- Grant SELECT permission to anon role for product_details table
-- RLS policy exists but anon role needs table-level SELECT permission

GRANT SELECT ON product_details TO anon;
GRANT SELECT ON product_details TO authenticated;

SELECT 'Granted SELECT on product_details to anon and authenticated roles' as message;
