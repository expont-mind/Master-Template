-- ============================================================================
-- Update create_order_from_invoice RPC to handle pre-created orders
-- Orders are now created with 'pending' status when invoice is created
-- This RPC should update the order status to 'confirmed' when payment is confirmed
-- ============================================================================

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
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        -- Check if order exists
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

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
                updated_at = now()
            WHERE id = v_order_id;

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

    -- Create order with confirmed status (payment already verified)
    INSERT INTO orders (user_id, order_number, status, payment_status, total_amount)
    VALUES (v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_invoice.amount)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_from_invoice(text) TO service_role;
GRANT EXECUTE ON FUNCTION create_order_from_invoice(text) TO authenticated;

-- ============================================================================
-- Update admin notification trigger to fire when order becomes confirmed
-- ============================================================================

-- Update trigger function to check for confirmed status
CREATE OR REPLACE FUNCTION create_admin_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_phone TEXT;
BEGIN
    -- Only send notification when order is confirmed
    -- This handles both INSERT with confirmed status (legacy) and UPDATE from pending to confirmed (new flow)
    IF TG_OP = 'INSERT' AND NEW.status != 'confirmed' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Only trigger on status change to confirmed
        IF OLD.status = 'confirmed' OR NEW.status != 'confirmed' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Get user info
    SELECT
        COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email),
        COALESCE(primary_phone, '')
    INTO v_user_name, v_user_phone
    FROM users
    WHERE id = NEW.user_id;

    -- Create admin notification
    INSERT INTO admin_notifications (type, title, body, metadata)
    VALUES (
        'order',
        'Шинэ захиалга ирлээ',
        format('Захиалга #%s - %s (%s₮)',
            COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)),
            COALESCE(v_user_name, 'Хэрэглэгч'),
            NEW.total_amount::text
        ),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'user_id', NEW.user_id,
            'user_name', v_user_name,
            'user_phone', v_user_phone,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'payment_status', NEW.payment_status
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one that also fires on UPDATE
DROP TRIGGER IF EXISTS trigger_admin_order_notification ON orders;
CREATE TRIGGER trigger_admin_order_notification
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_order_notification();

-- ============================================================================
-- Enable realtime for orders table (for frontend payment status updates)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;
