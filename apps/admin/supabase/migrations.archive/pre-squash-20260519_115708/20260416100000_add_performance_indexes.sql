-- Performance indexes for common admin queries

-- Orders: payment_status + created_at compound index (most common filter combination)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at
  ON orders (payment_status, created_at DESC);

-- Orders: user_id foreign key index (used in joins and user order lookups)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- Orders: payment_method filter
CREATE INDEX IF NOT EXISTS idx_orders_payment_method
  ON orders (payment_method);

-- Order items: order_id foreign key index (used in joins)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- Order items: product_id for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);
