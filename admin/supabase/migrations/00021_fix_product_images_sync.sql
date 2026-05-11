-- Fix save_product to also update products.images column for frontend compatibility
-- The frontend expects images as a text[] column on products table

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[]
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
  v_image_urls TEXT[] := '{}';
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

  -- Upsert variants
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

    -- Replace variant details
    DELETE FROM product_variant_details WHERE variant_id = v_variant_id;
    v_sort := 0;
    IF v_variant->'details' IS NOT NULL AND jsonb_array_length(v_variant->'details') > 0 THEN
      FOR v_detail IN SELECT * FROM jsonb_array_elements(v_variant->'details')
      LOOP
        IF COALESCE(v_detail->>'type', '') != '' AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
          INSERT INTO product_variant_details (variant_id, type, content, sort_order)
          VALUES (v_variant_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
          v_sort := v_sort + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products.images column for frontend compatibility
  UPDATE products SET images = v_image_urls WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Find the real variant_id from our array
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- For newly created variants, find by matching position
      -- The variant was already inserted above so look it up by sku+name+product_id
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

-- Backfill existing products: sync product_images to products.images column
UPDATE products p
SET images = COALESCE(
  (
    SELECT array_agg(pi.url ORDER BY pi.sort_order)
    FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.variant_id IS NULL
  ),
  '{}'
);
