-- Search logs table to track user searches for trending feature
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,              -- Normalized (lowercase, trimmed)
  raw_query TEXT NOT NULL,          -- Original as typed
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,                  -- For anonymous tracking
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query_created ON search_logs(query, created_at DESC);

-- RLS policies
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log searches" ON search_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RPC: Get trending searches with exponential decay
-- weight = e^(-0.693 * age_in_days) -> today=1.0, yesterday=0.5, 2 days ago=0.25
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INT DEFAULT 5,
  p_days INT DEFAULT 7,
  p_min_count INT DEFAULT 2
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
      AND sl.result_count > 0
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

GRANT EXECUTE ON FUNCTION get_trending_searches TO anon, authenticated;
