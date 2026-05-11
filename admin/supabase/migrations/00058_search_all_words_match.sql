-- ============================================================================
-- Improve search to match all words in query (not just consecutive)
-- ============================================================================
-- Example: searching "medicube body wash" will now match "medicube red acne body wash"
-- because all three words (medicube, body, wash) are present in the product name

DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

-- Helper function to check if all search words are present in text
CREATE OR REPLACE FUNCTION check_all_words_match(p_text text, p_search_words text[])
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_word text;
  v_lower_text text := lower(p_text);
BEGIN
  IF p_search_words IS NULL OR array_length(p_search_words, 1) IS NULL THEN
    RETURN true;
  END IF;

  FOREACH v_word IN ARRAY p_search_words LOOP
    IF v_lower_text NOT LIKE '%' || v_word || '%' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
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
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
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

-- Also update search_suggestions to use the same all-words-match logic
CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_search_words text[];
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(lower(trim(p_search_query)), ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL ORDER BY pi.sort_order LIMIT 1)::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
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
      AND check_all_words_match(c.name, v_search_words)
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
    WHERE check_all_words_match(b.name, v_search_words)
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;
