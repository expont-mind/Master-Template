-- Update search_suggestions to include brands
-- Merged from 00028_fix_search_similarity_threshold.sql with brands support

CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      p.images[1]::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND c.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  UNION ALL
  (
    SELECT
      'brand'::text AS type,
      b.name::text AS text,
      b.slug::text,
      b.logo_url::text AS image,
      similarity(b.name, p_search_query)::real AS similarity
    FROM brands b
    WHERE b.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;
