-- Create order status history table to track all status changes
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status_type TEXT NOT NULL CHECK (status_type IN ('order', 'delivery', 'payment')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by order
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(order_id, changed_at DESC);

-- Trigger function to auto-record status changes
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Track delivery_status changes
  IF OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'delivery', OLD.delivery_status::TEXT, NEW.delivery_status::TEXT);
  END IF;

  -- Track order status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'order', OLD.status::TEXT, NEW.status::TEXT);
  END IF;

  -- Track payment_status changes
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'payment', OLD.payment_status::TEXT, NEW.payment_status::TEXT);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_order_status_change();

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policy for service role (admin API)
CREATE POLICY "Service role can do anything" ON order_status_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to read their own order history
CREATE POLICY "Users can view their own order history" ON order_status_history
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
