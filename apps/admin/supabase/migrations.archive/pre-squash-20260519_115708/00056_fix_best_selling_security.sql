-- Fix best selling products RPC to use SECURITY DEFINER
-- This allows the function to bypass RLS and read all order_items

DROP FUNCTION IF EXISTS get_best_selling_products(int, int);

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_period_days int DEFAULT 7,
  p_limit int DEFAULT 40
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  discount_price numeric,
  sku text,
  barcode text,
  stock_quantity int,
  is_active boolean,
  is_featured boolean,
  brand_id uuid,
  metadata jsonb,
  created_at timestamp,
  updated_at timestamp,
  images text[],
  category_id uuid,
  total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  start_date timestamp := now() - (p_period_days || ' days')::interval;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT
      oi.product_id,
      SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= start_date
      AND o.status != 'canceled'
    GROUP BY oi.product_id
  )
  SELECT
    p.id,
    p.name::text,
    p.slug::text,
    p.description::text,
    p.price,
    p.discount_price,
    p.sku::text,
    p.barcode::text,
    p.stock_quantity,
    p.is_active,
    p.is_featured,
    p.brand_id,
    p.metadata,
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order)
       FROM product_images pi
       WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
      '{}'::text[]
    ) AS images,
    (SELECT pc.category_id FROM product_categories pc WHERE pc.product_id = p.id LIMIT 1) AS category_id,
    COALESCE(s.total_sold, 0::bigint) AS total_sold
  FROM products p
  INNER JOIN sales s ON s.product_id = p.id
  WHERE p.is_active = true
    AND s.total_sold > 0
  ORDER BY s.total_sold DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO anon;
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO authenticated;
