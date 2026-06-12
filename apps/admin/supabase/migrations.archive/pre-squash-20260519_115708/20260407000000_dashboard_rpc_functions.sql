-- ============================================================================
-- Dashboard RPC functions for server-side aggregation
--
-- Replaces client-side batched pagination (30+ sequential queries)
-- with 3 single SQL queries that aggregate in Postgres.
-- ============================================================================

-- 1. Total revenue from paid, non-canceled orders
CREATE OR REPLACE FUNCTION get_total_revenue(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM orders
  WHERE payment_status = 'paid'
    AND status != 'canceled'
    AND (p_from IS NULL OR created_at >= p_from)
    AND (p_to   IS NULL OR created_at < p_to);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Revenue grouped by day (in UB timezone)
CREATE OR REPLACE FUNCTION get_revenue_by_day(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ
)
RETURNS TABLE(day DATE, revenue NUMERIC) AS $$
  SELECT
    (created_at AT TIME ZONE 'Asia/Ulaanbaatar')::date AS day,
    SUM(total_amount) AS revenue
  FROM orders
  WHERE payment_status = 'paid'
    AND status != 'canceled'
    AND created_at >= p_from
    AND created_at < p_to
  GROUP BY day
  ORDER BY day;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Top selling products by quantity
CREATE OR REPLACE FUNCTION get_top_selling_products(
  p_from  TIMESTAMPTZ DEFAULT NULL,
  p_to    TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  product_id  UUID,
  product_name TEXT,
  units_sold  BIGINT,
  revenue     NUMERIC
) AS $$
  SELECT
    oi.product_id,
    p.name AS product_name,
    SUM(oi.quantity)::BIGINT AS units_sold,
    SUM(oi.quantity * oi.price) AS revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.payment_status = 'paid'
    AND o.status != 'canceled'
    AND (p_from IS NULL OR o.created_at >= p_from)
    AND (p_to   IS NULL OR o.created_at < p_to)
  GROUP BY oi.product_id, p.name
  ORDER BY units_sold DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grant access to service_role (used by admin API)
GRANT EXECUTE ON FUNCTION get_total_revenue TO service_role;
GRANT EXECUTE ON FUNCTION get_revenue_by_day TO service_role;
GRANT EXECUTE ON FUNCTION get_top_selling_products TO service_role;
