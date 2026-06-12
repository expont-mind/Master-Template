-- Allow users to delete their own notifications
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow users to delete their own order status history
CREATE POLICY "order_status_history_delete" ON order_status_history
  FOR DELETE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
