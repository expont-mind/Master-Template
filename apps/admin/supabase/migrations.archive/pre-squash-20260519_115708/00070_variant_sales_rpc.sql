-- Variant sales breakdown for a single product
-- Returns all active variants with their sales data (0 if none)

CREATE OR REPLACE FUNCTION get_variant_sales(
  p_product_id uuid,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  variant_id uuid,
  variant_name text,
  price numeric,
  discount_price numeric,
  stock_quantity int,
  qty_sold bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id AS variant_id,
    pv.name::text AS variant_name,
    pv.price,
    pv.discount_price,
    pv.stock_quantity,
    COALESCE(SUM(oi.quantity), 0)::bigint AS qty_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
  FROM product_variants pv
  LEFT JOIN order_items oi
    ON oi.variant_id = pv.id
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = oi.order_id
        AND o.status != 'canceled'
        AND o.payment_status = 'paid'
        AND (p_date_from IS NULL OR o.created_at >= p_date_from)
        AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    )
  WHERE pv.product_id = p_product_id
    AND pv.status = 'active'
  GROUP BY pv.id, pv.name, pv.price, pv.discount_price, pv.stock_quantity
  ORDER BY qty_sold DESC, pv.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_sales(uuid, timestamptz, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION get_variant_sales(uuid, timestamptz, timestamptz) TO authenticated;
