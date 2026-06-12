-- ============================================================================
-- create_free_order RPC: handles 0-MNT purchases (fully covered by points/coupons)
--
-- Mirrors web's createFreeOrder() server action. Lets mobile create a
-- confirmed/paid free order via a single RPC call without going through
-- a payment provider edge function.
--
-- SECURITY DEFINER bypasses RLS for inserts into orders/order_items/
-- coupon_usages. Server-side total verification + point balance check
-- prevents users from faking 0-MNT orders for paid items.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_free_order(
  p_items jsonb,
  p_address jsonb,
  p_points_used integer DEFAULT 0,
  p_point_discount numeric DEFAULT 0,
  p_coupon_id uuid DEFAULT NULL,
  p_coupon_discount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_ts text;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_items_total numeric := 0;
  v_delivery_fee numeric := 0;
  v_zone record;
  v_city text;
  v_final_total numeric;
  v_balance integer;
  v_coupon record;
  v_user_coupon_count integer;
  v_per_user_limit integer;
  i integer;
BEGIN
  -- 1. Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  -- 2. Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Сагс хоосон байна');
  END IF;

  -- 3. Validate address
  v_city := p_address->>'city';
  IF v_city IS NULL OR v_city = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Хот/Аймаг сонгоно уу');
  END IF;
  IF (p_address->>'district') IS NULL OR (p_address->>'district') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Дүүрэг/Сум сонгоно уу');
  END IF;
  IF (p_address->>'sub_district') IS NULL OR (p_address->>'sub_district') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Хороо/Баг сонгоно уу');
  END IF;
  IF (p_address->>'detail') IS NULL OR TRIM(p_address->>'detail') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Дэлгэрэнгүй хаяг оруулна уу');
  END IF;

  -- 4. Server-side validation + total calculation (don't trust client prices)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Тоо ширхэг буруу байна');
    END IF;

    -- Verify product is active
    IF NOT EXISTS (
      SELECT 1 FROM products WHERE id = v_product_id AND is_active = true
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Бүтээгдэхүүн идэвхгүй байна');
    END IF;

    -- Lookup price (variant first, else product)
    IF v_variant_id IS NOT NULL THEN
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM product_variants
      WHERE id = v_variant_id AND status = 'active' AND stock_quantity >= v_quantity;

      IF v_unit_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Хувилбар идэвхгүй эсвэл нөөц хүрэлцэхгүй байна');
      END IF;
    ELSE
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM products
      WHERE id = v_product_id AND stock_quantity >= v_quantity;

      IF v_unit_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Бүтээгдэхүүн нөөц хүрэлцэхгүй байна');
      END IF;
    END IF;

    v_items_total := v_items_total + (v_unit_price * v_quantity);
  END LOOP;

  -- 5. Calculate delivery fee from delivery_zones (matches web's calculateDeliveryFee)
  IF v_city = 'Улаанбаатар' THEN
    SELECT * INTO v_zone FROM delivery_zones WHERE name = 'Улаанбаатар' AND is_active = true;
  ELSE
    SELECT * INTO v_zone FROM delivery_zones WHERE name = 'Орон нутаг' AND is_active = true;
  END IF;

  IF v_zone IS NOT NULL THEN
    IF v_zone.is_free_delivery_enabled
       AND v_zone.free_delivery_threshold IS NOT NULL
       AND v_items_total >= v_zone.free_delivery_threshold THEN
      v_delivery_fee := 0;
    ELSE
      v_delivery_fee := COALESCE(v_zone.delivery_fee, 0);
    END IF;
  END IF;

  -- 6. Verify final total = 0 (small epsilon for floating point)
  v_final_total := v_items_total + v_delivery_fee - COALESCE(p_coupon_discount, 0) - COALESCE(p_point_discount, 0);
  IF v_final_total > 0.01 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Төлбөрийн дүн 0-ээс их байна',
      'computed_total', v_final_total
    );
  END IF;

  -- 7. Verify point balance is sufficient
  IF p_points_used > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM point_transactions
    WHERE user_id = v_user_id;

    IF v_balance < p_points_used THEN
      RETURN jsonb_build_object('success', false, 'error', 'Онооны үлдэгдэл хүрэлцэхгүй байна');
    END IF;
  END IF;

  -- 8. Generate 8-char order number (4 timestamp base36 + 4 random)
  v_ts := UPPER(LPAD(
    TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT),
    8, '0'
  ));
  v_order_number := SUBSTR(v_ts, LENGTH(v_ts) - 3, 4);
  FOR i IN 1..4 LOOP
    v_order_number := v_order_number || SUBSTR(v_chars, FLOOR(RANDOM() * 36)::int + 1, 1);
  END LOOP;

  -- 9. Insert order (confirmed + paid + free)
  INSERT INTO orders (
    user_id, order_number, status, payment_status, paid_at,
    payment_method, total_amount, delivery_fee,
    points_used, coupon_id, coupon_discount,
    delivery_city, delivery_district, delivery_sub_district, delivery_detail
  ) VALUES (
    v_user_id, v_order_number, 'confirmed', 'paid', NOW(),
    'free', 0, v_delivery_fee,
    COALESCE(p_points_used, 0), p_coupon_id, COALESCE(p_coupon_discount, 0),
    p_address->>'city', p_address->>'district',
    p_address->>'sub_district', p_address->>'detail'
  )
  RETURNING id INTO v_order_id;

  -- 10. Insert order items (re-iterate; trust DB price as source of truth)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_variant_id IS NOT NULL THEN
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM product_variants WHERE id = v_variant_id;
    ELSE
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM products WHERE id = v_product_id;
    END IF;

    INSERT INTO order_items (
      order_id, product_id, variant_id, variant_name, price, quantity
    ) VALUES (
      v_order_id, v_product_id, v_variant_id,
      v_item->>'variant_name', v_unit_price, v_quantity
    );
  END LOOP;

  -- 11. Decrement stock + mark
  PERFORM decrement_order_stock(v_order_id);
  UPDATE orders SET stock_decremented = true WHERE id = v_order_id;

  -- 12. Record point usage (idempotent — guarded by NOT EXISTS check)
  IF p_points_used > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM point_transactions
      WHERE order_id = v_order_id AND type = 'used'
    ) THEN
      INSERT INTO point_transactions (user_id, order_id, type, amount, description)
      VALUES (v_user_id, v_order_id, 'used', -p_points_used, 'Захиалга #' || v_order_number);
    END IF;
  END IF;

  -- 13. Record coupon usage (with limit checks)
  IF p_coupon_id IS NOT NULL AND COALESCE(p_coupon_discount, 0) > 0 THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;

    IF FOUND THEN
      v_per_user_limit := COALESCE(v_coupon.usage_limit_per_user, 1);

      SELECT COUNT(*) INTO v_user_coupon_count
      FROM coupon_usages
      WHERE coupon_id = p_coupon_id AND user_id = v_user_id;

      IF (v_coupon.usage_limit IS NULL OR COALESCE(v_coupon.usage_count, 0) < v_coupon.usage_limit)
         AND v_user_coupon_count < v_per_user_limit THEN
        INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount)
        VALUES (p_coupon_id, v_user_id, v_order_id, p_coupon_discount);

        UPDATE coupons
        SET usage_count = COALESCE(usage_count, 0) + 1
        WHERE id = p_coupon_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_free_order(jsonb, jsonb, integer, numeric, uuid, numeric) TO authenticated;
