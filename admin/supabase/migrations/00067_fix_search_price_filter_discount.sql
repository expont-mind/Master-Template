-- Fix search_products price filter to use discount_price when available
-- Previously it always filtered on original price, ignoring discounted prices

DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

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
  discount_price numeric,
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
  v_search_words text[];
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(lower(trim(p_search_query)), ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.discount_price,
      COALESCE(
        (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
        '{}'::text[]
      ) AS images,
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
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      -- Check if all words match in name OR description
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price >= p_min_price
          ELSE p.price >= p_min_price
        END)
      AND (p_max_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price <= p_max_price
          ELSE p.price <= p_max_price
        END)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.discount_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM (
    SELECT DISTINCT ON (matched.id)
      matched.*
    FROM matched
  ) m
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
