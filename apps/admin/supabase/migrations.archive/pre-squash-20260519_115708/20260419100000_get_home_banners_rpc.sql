-- Single RPC that returns all three banner types for the mobile home screen.
-- Reduces per-session DB roundtrips from 3 (carousel + promo + small) to 1
-- and bypasses per-row RLS evaluation via SECURITY DEFINER.
-- Intended for mobile use; web continues to use its SSR query.

CREATE OR REPLACE FUNCTION get_home_banners()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'carousel', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'carousel'
        ORDER BY sort_order
        LIMIT 10
      ) b
    ), '[]'::jsonb),
    'promo', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'promo'
        ORDER BY sort_order
      ) b
    ), '[]'::jsonb),
    'small', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'small'
        ORDER BY sort_order
      ) b
    ), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION get_home_banners() TO anon, authenticated;
