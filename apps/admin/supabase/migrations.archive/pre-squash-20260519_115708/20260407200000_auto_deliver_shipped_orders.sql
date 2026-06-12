-- Auto-transition delivery_status from 'shipped' to 'delivered' after 24 hours.
-- Relies on order_status_history to determine when the order was shipped.
-- Existing triggers handle: history logging (record_order_status_change)
-- and push notifications (send_push_on_status_change).

CREATE OR REPLACE FUNCTION auto_deliver_shipped_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET delivery_status = 'delivered',
      updated_at = NOW()
  WHERE delivery_status = 'shipped'
    AND id IN (
      SELECT DISTINCT osh.order_id
      FROM order_status_history osh
      WHERE osh.status_type = 'delivery'
        AND osh.new_status = 'shipped'
        AND osh.changed_at <= NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule: run every hour
SELECT cron.schedule(
  'auto-deliver-shipped-orders',
  '0 * * * *',
  $$ SELECT auto_deliver_shipped_orders(); $$
);
