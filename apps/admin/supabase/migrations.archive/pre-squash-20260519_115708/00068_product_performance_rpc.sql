-- Product performance RPC: server-side aggregation with pagination, sorting, search
-- Supports date range filtering for order-based metrics

DROP FUNCTION IF EXISTS get_product_performance(text, text, text, int, int);

CREATE OR REPLACE FUNCTION get_product_performance(
  p_search text DEFAULT NULL,
  p_sort_column text DEFAULT 'qty_sold',
  p_sort_dir text DEFAULT 'desc',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount_price numeric,
  status text,
  qty_sold bigint,
  revenue numeric,
  stock bigint,
  variant_count bigint,
  avg_rating numeric,
  review_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH product_sales AS (
    SELECT
      oi.product_id,
      COALESCE(SUM(oi.quantity), 0)::bigint AS qty_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'canceled'
      AND o.payment_status = 'paid'
      AND (p_date_from IS NULL OR o.created_at >= p_date_from)
      AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    GROUP BY oi.product_id
  ),
  product_reviews AS (
    SELECT
      r.product_id,
      AVG(r.rating)::numeric AS avg_rating,
      COUNT(*)::bigint AS review_count
    FROM reviews r
    WHERE r.status = 'active'
    GROUP BY r.product_id
  ),
  product_stock AS (
    SELECT
      p.id AS product_id,
      CASE
        WHEN COUNT(pv.id) > 0 THEN COALESCE(SUM(pv.stock_quantity), 0)
        ELSE COALESCE(p.stock_quantity, 0)
      END::bigint AS stock,
      COUNT(pv.id)::bigint AS variant_count
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id, p.stock_quantity
  ),
  filtered AS (
    SELECT
      p.id,
      p.name::text,
      p.price,
      p.discount_price,
      p.status::text,
      COALESCE(ps.qty_sold, 0::bigint) AS qty_sold,
      COALESCE(ps.revenue, 0::numeric) AS revenue,
      COALESCE(st.stock, 0::bigint) AS stock,
      COALESCE(st.variant_count, 0::bigint) AS variant_count,
      pr.avg_rating,
      COALESCE(pr.review_count, 0::bigint) AS review_count
    FROM products p
    LEFT JOIN product_sales ps ON ps.product_id = p.id
    LEFT JOIN product_reviews pr ON pr.product_id = p.id
    LEFT JOIN product_stock st ON st.product_id = p.id
    WHERE (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%')
  )
  SELECT
    f.id,
    f.name,
    f.price,
    f.discount_price,
    f.status,
    f.qty_sold,
    f.revenue,
    f.stock,
    f.variant_count,
    f.avg_rating,
    f.review_count,
    COUNT(*) OVER()::bigint AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort_dir = 'asc' THEN
      CASE p_sort_column
        WHEN 'name' THEN f.name
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_dir = 'desc' THEN
      CASE p_sort_column
        WHEN 'name' THEN f.name
      END
    END DESC NULLS LAST,
    CASE WHEN p_sort_dir = 'asc' THEN
      CASE p_sort_column
        WHEN 'price' THEN f.price
        WHEN 'qty_sold' THEN f.qty_sold::numeric
        WHEN 'revenue' THEN f.revenue
        WHEN 'stock' THEN f.stock::numeric
        WHEN 'variant_count' THEN f.variant_count::numeric
        WHEN 'avg_rating' THEN COALESCE(f.avg_rating, -1)
        WHEN 'review_count' THEN f.review_count::numeric
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_dir = 'desc' THEN
      CASE p_sort_column
        WHEN 'price' THEN f.price
        WHEN 'qty_sold' THEN f.qty_sold::numeric
        WHEN 'revenue' THEN f.revenue
        WHEN 'stock' THEN f.stock::numeric
        WHEN 'variant_count' THEN f.variant_count::numeric
        WHEN 'avg_rating' THEN COALESCE(f.avg_rating, -1)
        WHEN 'review_count' THEN f.review_count::numeric
      END
    END DESC NULLS LAST,
    f.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_performance(text, text, text, int, int, timestamptz, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION get_product_performance(text, text, text, int, int, timestamptz, timestamptz) TO authenticated;
