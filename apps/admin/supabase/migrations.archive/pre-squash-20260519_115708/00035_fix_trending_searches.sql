-- Fix trending searches RPC to include all searches (not just those with results)
-- and lower the default min_count
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INT DEFAULT 5,
  p_days INT DEFAULT 7,
  p_min_count INT DEFAULT 1
)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  weighted_score NUMERIC,
  last_searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH search_stats AS (
    SELECT
      sl.query,
      COUNT(*) AS raw_count,
      MAX(sl.created_at) AS last_searched,
      SUM(EXP(-0.693 * EXTRACT(EPOCH FROM (NOW() - sl.created_at)) / 86400)) AS weighted_score
    FROM search_logs sl
    WHERE sl.created_at > NOW() - (p_days || ' days')::INTERVAL
      AND LENGTH(sl.query) >= 2
    GROUP BY sl.query
    HAVING COUNT(*) >= p_min_count
  )
  SELECT
    ss.query,
    ss.raw_count AS search_count,
    ROUND(ss.weighted_score::NUMERIC, 2) AS weighted_score,
    ss.last_searched AS last_searched_at
  FROM search_stats ss
  ORDER BY ss.weighted_score DESC, ss.raw_count DESC
  LIMIT p_limit;
END;
$$;
