-- Fix search functions: use ILIKE for reliable substring matching + trigram for ranking
-- The trigram % operator and similarity threshold were unreliable for mixed Latin/Cyrillic text

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
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  compare_at_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.compare_at_price,
      p.images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.compare_at_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;
