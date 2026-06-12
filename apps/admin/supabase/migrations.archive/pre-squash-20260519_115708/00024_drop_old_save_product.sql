-- Drop the old 4-parameter version of save_product
-- This resolves the ambiguous function call error
DROP FUNCTION IF EXISTS public.save_product(jsonb, jsonb, jsonb, uuid[]);

SELECT 'Dropped old save_product function' as message;
