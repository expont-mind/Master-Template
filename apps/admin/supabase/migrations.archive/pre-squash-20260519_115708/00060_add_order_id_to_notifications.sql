-- Add order_id column to notifications table so notifications can link to specific orders
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
