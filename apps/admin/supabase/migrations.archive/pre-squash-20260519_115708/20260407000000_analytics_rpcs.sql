-- ============================================================================
-- Analytics RPC functions for the revamped analytics page
-- ============================================================================

-- 1. Order Heatmap: day-of-week × hour-of-day order counts
CREATE OR REPLACE FUNCTION get_order_heatmap(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  day_of_week int,
  hour_of_day int,
  order_count bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    (EXTRACT(ISODOW FROM created_at AT TIME ZONE 'Asia/Ulaanbaatar')::int - 1) AS day_of_week,
    EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ulaanbaatar')::int AS hour_of_day,
    COUNT(*)::bigint AS order_count
  FROM orders
  WHERE status != 'canceled'
    AND (p_date_from IS NULL OR created_at >= p_date_from)
    AND (p_date_to IS NULL OR created_at < p_date_to)
  GROUP BY day_of_week, hour_of_day
  ORDER BY day_of_week, hour_of_day;
$$;

-- 2. Returning vs New Users: users who ordered in current period
CREATE OR REPLACE FUNCTION get_returning_vs_new_users(
  p_date_from timestamptz,
  p_date_to timestamptz
)
RETURNS TABLE(
  new_buyers bigint,
  returning_buyers bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH current_orderers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE status != 'canceled'
      AND created_at >= p_date_from
      AND created_at < p_date_to
  ),
  prev_orderers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE status != 'canceled'
      AND created_at < p_date_from
  )
  SELECT
    COUNT(*) FILTER (WHERE co.user_id NOT IN (SELECT user_id FROM prev_orderers))::bigint AS new_buyers,
    COUNT(*) FILTER (WHERE co.user_id IN (SELECT user_id FROM prev_orderers))::bigint AS returning_buyers
  FROM current_orderers co;
$$;

-- 3. Top Spenders: users ranked by total spending
CREATE OR REPLACE FUNCTION get_top_spenders(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  primary_phone text,
  total_spent numeric,
  order_count bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    u.id AS user_id,
    u.first_name::text,
    u.last_name::text,
    u.email::text,
    u.primary_phone::text,
    COALESCE(SUM(o.total_amount), 0)::numeric AS total_spent,
    COUNT(o.id)::bigint AS order_count
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status != 'canceled'
    AND o.payment_status = 'paid'
    AND (p_date_from IS NULL OR o.created_at >= p_date_from)
    AND (p_date_to IS NULL OR o.created_at < p_date_to)
  GROUP BY u.id, u.first_name, u.last_name, u.email, u.primary_phone
  ORDER BY total_spent DESC
  LIMIT p_limit;
$$;

-- 4. Coupon Analytics: aggregated coupon usage data
CREATE OR REPLACE FUNCTION get_coupon_analytics(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_usages bigint,
  total_discount numeric,
  top_coupons jsonb,
  usage_by_day jsonb
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_total_usages bigint;
  v_total_discount numeric;
  v_top_coupons jsonb;
  v_usage_by_day jsonb;
BEGIN
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(cu.discount_amount), 0)::numeric
  INTO v_total_usages, v_total_discount
  FROM coupon_usages cu
  WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
    AND (p_date_to IS NULL OR cu.used_at < p_date_to);

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_coupons
  FROM (
    SELECT
      c.code,
      c.type::text AS type,
      COUNT(cu.id)::bigint AS usage_count,
      COALESCE(SUM(cu.discount_amount), 0)::numeric AS total_discount
    FROM coupon_usages cu
    INNER JOIN coupons c ON c.id = cu.coupon_id
    WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
      AND (p_date_to IS NULL OR cu.used_at < p_date_to)
    GROUP BY c.id, c.code, c.type
    ORDER BY usage_count DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_usage_by_day
  FROM (
    SELECT
      (cu.used_at AT TIME ZONE 'Asia/Ulaanbaatar')::date::text AS date,
      COUNT(*)::bigint AS count
    FROM coupon_usages cu
    WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
      AND (p_date_to IS NULL OR cu.used_at < p_date_to)
    GROUP BY (cu.used_at AT TIME ZONE 'Asia/Ulaanbaatar')::date
    ORDER BY date
  ) t;

  RETURN QUERY SELECT v_total_usages, v_total_discount, v_top_coupons, v_usage_by_day;
END;
$$;
