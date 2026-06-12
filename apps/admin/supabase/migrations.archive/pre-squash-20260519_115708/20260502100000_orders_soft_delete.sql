-- ============================================================================
-- Soft-delete for orders
--
-- Replaces the hard-delete flow in delete_unpaid_order so we never lose the
-- order or its payment_invoices rows. The risk we're closing:
--
--   T0: user starts QPay → order + payment_invoices created, QR shown
--   T1: user (or another tab) calls delete_unpaid_order
--   T2: under the old hard-delete RPC the invoice row was DELETEd, so a
--       callback arriving at T3 had nothing to match → user paid, system
--       lost the order, no recovery possible.
--
-- Soft-delete keeps everything in place. Lists filter on is_deleted=false
-- (see frontend + mobile changes accompanying this migration). If a callback
-- still arrives after the user "deleted" the order, create_order_from_invoice
-- now also flips is_deleted back to false and confirms the order — money is
-- never lost.
-- ============================================================================

-- 1. Schema additions ---------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index keeps the user-orders list query fast even after months of
-- soft-deletes accumulate. All app reads filter is_deleted = false.
CREATE INDEX IF NOT EXISTS idx_orders_user_active
  ON orders(user_id, created_at DESC)
  WHERE is_deleted = false;

-- 2. delete_unpaid_order: soft delete instead of hard --------------------------
-- DROP first because the previous version may have a different return type
-- in production; CREATE OR REPLACE can't change return signatures.
DROP FUNCTION IF EXISTS delete_unpaid_order(uuid);

CREATE OR REPLACE FUNCTION delete_unpaid_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  SELECT id, user_id, payment_status, is_deleted
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Захиалга олдсонгүй');
  END IF;

  IF v_order.user_id <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Энэ захиалгыг устгах эрхгүй');
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'processing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Зөвхөн төлбөр хийгдээгүй захиалгыг устгах боломжтой'
    );
  END IF;

  IF v_order.is_deleted THEN
    -- Idempotent: already hidden, nothing to do.
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'already_deleted', true);
  END IF;

  -- Hide the order from the user's lists. Keep order_items, payment_invoices,
  -- coupon_usages, point_transactions intact so callbacks/recovery still
  -- have everything they need if the user ends up paying anyway.
  UPDATE orders
  SET is_deleted = true,
      deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_unpaid_order(uuid) TO authenticated;

-- 3. create_order_from_invoice: resurrect on payment ---------------------------
-- If the user soft-deleted an order and then ended up paying anyway (race or
-- mind-changed), the callback path must un-hide it so admin/user actually see
-- the paid order. We only patch the two existing branches that update an
-- existing orders row — the legacy "create new order" branch is unchanged.
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- Path 1: invoice already linked to an order — confirm + resurrect if soft-deleted.
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                is_deleted = false,
                deleted_at = NULL,
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid' OR is_deleted = true);

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- Path 2: link by order_number — same resurrect logic.
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                is_deleted = false,
                deleted_at = NULL,
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid' OR is_deleted = true);

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- Path 3 (legacy): create new order from pending_order_data. Unchanged.
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    v_address := v_invoice.pending_order_data->'address';

    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented, paid_at
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true, now()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    PERFORM decrement_order_stock(v_order_id);

    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$;
