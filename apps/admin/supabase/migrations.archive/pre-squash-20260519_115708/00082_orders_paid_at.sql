-- ============================================================================
-- Add paid_at timestamp to orders + update RPC to set it on payment confirm
-- ============================================================================

-- 1. Add paid_at column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 2. Backfill from payment_invoices.updated_at for existing paid orders
UPDATE orders o
SET paid_at = pi.updated_at
FROM payment_invoices pi
WHERE pi.order_id = o.id
  AND pi.status = 'paid'
  AND o.payment_status = 'paid'
  AND o.paid_at IS NULL;

-- 3. Index for sorting
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders (paid_at DESC NULLS LAST);

-- 4. Updated create_order_from_invoice with paid_at + storepay provider mapping
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
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            -- Update invoice status
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

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            -- Link invoice to order
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

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Extract address from pending_order_data
    v_address := v_invoice.pending_order_data->'address';

    -- Create order with confirmed status (payment already verified) and delivery address
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

    -- Create order items
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

    -- Decrement stock for newly created order
    PERFORM decrement_order_stock(v_order_id);

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
