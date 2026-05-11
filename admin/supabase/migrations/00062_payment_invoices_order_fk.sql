-- Add FK constraint on payment_invoices.order_id -> orders.id
-- Required for Supabase PostgREST nested select (joins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_invoices_order_id_fkey'
    AND table_name = 'payment_invoices'
  ) THEN
    ALTER TABLE payment_invoices
      ADD CONSTRAINT payment_invoices_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;
