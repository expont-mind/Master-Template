-- ============================================================================
-- Add stock restoration for cancelled/failed orders
--
-- Previously, when an order was cancelled or payment failed, stock was
-- never restored. This creates a restore_order_stock() function that
-- reverses the decrement_order_stock() operation.
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item record;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.variant_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = p_order_id
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            -- Variant product: restore variant stock
            UPDATE product_variants
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.variant_id;

            -- Sync parent product stock = SUM of all active variant stocks
            UPDATE products
            SET stock_quantity = COALESCE(
                (SELECT SUM(pv.stock_quantity)
                 FROM product_variants pv
                 WHERE pv.product_id = v_item.product_id
                   AND pv.status = 'active'),
                0
            )
            WHERE id = v_item.product_id;
        ELSE
            -- Simple product (no variant): restore product stock directly
            UPDATE products
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;
END;
$$;
