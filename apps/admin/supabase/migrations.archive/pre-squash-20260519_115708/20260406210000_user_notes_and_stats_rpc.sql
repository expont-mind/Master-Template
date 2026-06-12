-- User notes table: skip if already exists
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);

-- RPC: get users with computed stats (point_balance, order_count, total_spent)
-- Supports server-side filtering and sorting by all fields
CREATE OR REPLACE FUNCTION get_users_with_stats(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_created_from TIMESTAMPTZ DEFAULT NULL,
  p_created_to TIMESTAMPTZ DEFAULT NULL,
  p_point_min BIGINT DEFAULT NULL,
  p_point_max BIGINT DEFAULT NULL,
  p_order_count_min BIGINT DEFAULT NULL,
  p_order_count_max BIGINT DEFAULT NULL,
  p_total_spent_min NUMERIC DEFAULT NULL,
  p_total_spent_max NUMERIC DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  primary_phone TEXT,
  avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  point_balance BIGINT,
  order_count BIGINT,
  total_spent NUMERIC,
  total_count BIGINT
) AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      u.id AS uid,
      COALESCE(pt_agg.balance, 0)::BIGINT AS point_balance,
      COALESCE(o_agg.order_count, 0)::BIGINT AS order_count,
      COALESCE(o_agg.total_spent, 0)::NUMERIC AS total_spent
    FROM users u
    LEFT JOIN (
      SELECT pt.user_id, SUM(pt.amount)::BIGINT AS balance
      FROM point_transactions pt
      GROUP BY pt.user_id
    ) pt_agg ON pt_agg.user_id = u.id
    LEFT JOIN (
      SELECT o.user_id,
             COUNT(*)::BIGINT AS order_count,
             SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END)::NUMERIC AS total_spent
      FROM orders o
      GROUP BY o.user_id
    ) o_agg ON o_agg.user_id = u.id
  ),
  filtered AS (
    SELECT
      u.id, u.email, u.first_name, u.last_name, u.primary_phone,
      u.avatar_url, u.status::TEXT, u.created_at,
      us.point_balance, us.order_count, us.total_spent
    FROM users u
    JOIN user_stats us ON us.uid = u.id
    WHERE
      (p_status IS NULL OR u.status::TEXT = p_status)
      AND (p_search IS NULL OR (
        u.first_name ILIKE '%' || p_search || '%'
        OR u.last_name ILIKE '%' || p_search || '%'
        OR u.email ILIKE '%' || p_search || '%'
        OR u.primary_phone ILIKE '%' || p_search || '%'
      ))
      AND (p_created_from IS NULL OR u.created_at >= p_created_from)
      AND (p_created_to IS NULL OR u.created_at <= p_created_to + INTERVAL '1 day')
      AND (p_point_min IS NULL OR us.point_balance >= p_point_min)
      AND (p_point_max IS NULL OR us.point_balance <= p_point_max)
      AND (p_order_count_min IS NULL OR us.order_count >= p_order_count_min)
      AND (p_order_count_max IS NULL OR us.order_count <= p_order_count_max)
      AND (p_total_spent_min IS NULL OR us.total_spent >= p_total_spent_min)
      AND (p_total_spent_max IS NULL OR us.total_spent <= p_total_spent_max)
  )
  SELECT
    f.id, f.email, f.first_name, f.last_name, f.primary_phone,
    f.avatar_url, f.status, f.created_at,
    f.point_balance, f.order_count, f.total_spent,
    COUNT(*) OVER()::BIGINT AS total_count
  FROM filtered f
  ORDER BY
    CASE p_sort
      WHEN 'newest' THEN -EXTRACT(EPOCH FROM f.created_at)::NUMERIC
      WHEN 'oldest' THEN EXTRACT(EPOCH FROM f.created_at)::NUMERIC
      WHEN 'most_orders' THEN -f.order_count::NUMERIC
      WHEN 'highest_points' THEN -f.point_balance::NUMERIC
      WHEN 'highest_spent' THEN -f.total_spent::NUMERIC
      ELSE -EXTRACT(EPOCH FROM f.created_at)::NUMERIC
    END ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
