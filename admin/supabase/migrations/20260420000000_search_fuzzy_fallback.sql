-- ============================================================================
-- Search: fuzzy fallback + spelling suggestion
-- ============================================================================
-- 1. search_products now auto-broadens to trigram matching when strict
--    all-words-match returns fewer than FUZZY_THRESHOLD (5) rows.
--    The returned table gains a `fuzzy_fallback` boolean column so callers
--    can render "showing similar results" hints.
-- 2. New get_spelling_suggestion(text) returns the closest product / brand
--    / category name (trigram similarity >= 0.3) for "Did you mean?" UI.
--
-- Backward compatibility:
--  - p_allow_fuzzy defaults to TRUE, so existing 8-arg callers behave
--    the same *until* their query has < 5 strict hits.
--  - The new fuzzy_fallback column is additive; JSON decoders that pick
--    specific keys (mobile Flutter, web TS) ignore unknown fields.
-- ============================================================================

-- Drop old 8-arg signature; we recreate as 9-arg (with p_allow_fuzzy).
DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24,
  p_allow_fuzzy boolean DEFAULT true
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
  total_count bigint,
  fuzzy_fallback boolean
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_search_words text[];
  v_strict_count bigint;
  v_lower_query text := lower(trim(coalesce(p_search_query, '')));
  v_fuzzy_threshold constant int := 5;
  v_trgm_threshold constant real := 0.3;
  v_use_fuzzy boolean := false;
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(v_lower_query, ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  -- Decide whether to broaden to fuzzy. Only consider fuzzy when:
  --   - caller opted in (p_allow_fuzzy = true)
  --   - query is non-trivial (>= 2 chars)
  --   - strict-match result set is thin
  IF p_allow_fuzzy AND length(v_lower_query) >= 2 THEN
    SELECT COUNT(DISTINCT p.id) INTO v_strict_count
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
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
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false);

    IF v_strict_count < v_fuzzy_threshold THEN
      v_use_fuzzy := true;
    END IF;
  END IF;

  IF v_use_fuzzy THEN
    -- Fuzzy branch: broaden with trigram word_similarity. Keep price/category/
    -- stock filters unchanged; only the name/description predicate is relaxed.
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
          similarity(lower(p.name), v_lower_query),
          word_similarity(v_lower_query, lower(p.name)),
          similarity(lower(coalesce(p.description, '')), v_lower_query) * 0.5
        )::real AS similarity,
        p.created_at
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_active = true
        AND (
          word_similarity(v_lower_query, lower(p.name)) >= v_trgm_threshold
          OR similarity(lower(p.name), v_lower_query) >= v_trgm_threshold
          OR word_similarity(v_lower_query, lower(coalesce(p.description, ''))) >= v_trgm_threshold
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
      count(*) OVER() AS total_count,
      true AS fuzzy_fallback
    FROM (
      SELECT DISTINCT ON (matched.id) matched.* FROM matched
    ) m
    ORDER BY
      CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
      m.similarity DESC
    LIMIT p_page_size
    OFFSET offset_val;
  ELSE
    -- Strict branch: unchanged behaviour from migration 00067.
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
      count(*) OVER() AS total_count,
      false AS fuzzy_fallback
    FROM (
      SELECT DISTINCT ON (matched.id) matched.* FROM matched
    ) m
    ORDER BY
      CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
      m.similarity DESC
    LIMIT p_page_size
    OFFSET offset_val;
  END IF;
END;
$$;

-- ============================================================================
-- Spelling suggestion: closest product / brand / category name by trigram
-- similarity. Powers the "Did you mean X?" banner on the search results page.
-- ============================================================================
DROP FUNCTION IF EXISTS get_spelling_suggestion(text);

CREATE OR REPLACE FUNCTION get_spelling_suggestion(p_query text)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_lower text := lower(trim(coalesce(p_query, '')));
  v_best text;
  v_threshold constant real := 0.3;
BEGIN
  IF length(v_lower) < 2 THEN
    RETURN NULL;
  END IF;

  SELECT candidate INTO v_best
  FROM (
    SELECT p.name::text AS candidate,
           greatest(
             similarity(lower(p.name), v_lower),
             word_similarity(v_lower, lower(p.name))
           )::real AS score
    FROM products p
    WHERE p.is_active = true AND lower(p.name) <> v_lower
    UNION ALL
    SELECT b.name::text AS candidate,
           greatest(
             similarity(lower(b.name), v_lower),
             word_similarity(v_lower, lower(b.name))
           )::real AS score
    FROM brands b
    WHERE lower(b.name) <> v_lower
    UNION ALL
    SELECT c.name::text AS candidate,
           greatest(
             similarity(lower(c.name), v_lower),
             word_similarity(v_lower, lower(c.name))
           )::real AS score
    FROM categories c
    WHERE c.is_active = true AND lower(c.name) <> v_lower
  ) s
  WHERE s.score >= v_threshold
  ORDER BY s.score DESC
  LIMIT 1;

  RETURN v_best;
END;
$$;

GRANT EXECUTE ON FUNCTION get_spelling_suggestion(text) TO anon, authenticated;
