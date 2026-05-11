-- ============================================================================
-- REMOVE REDUNDANT COLUMNS FROM PRODUCTS TABLE
-- - images: Already stored in product_images table
-- - category_id: Already stored in product_categories junction table
-- ============================================================================

-- First, update save_product function to remove images sync
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Update search_suggestions to get image from product_images table
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
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL ORDER BY pi.sort_order LIMIT 1)::text AS image,
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

-- Update search_products to get category from product_categories junction
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
  v_pattern text := '%' || p_search_query || '%';
BEGIN
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
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
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

-- Drop redundant columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS images;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

SELECT 'Removed redundant images and category_id columns from products table' as message;
