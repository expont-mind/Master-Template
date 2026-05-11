-- Add is_read column to order_status_history for tracking notification read status
ALTER TABLE order_status_history ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Index for fast unread count queries
CREATE INDEX idx_order_status_history_is_read ON order_status_history(order_id, is_read) WHERE is_read = FALSE;

-- Policy for authenticated users to update is_read on their own order history
CREATE POLICY "Users can mark their own status history as read" ON order_status_history
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
