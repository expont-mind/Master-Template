-- ============================================================================
-- Enable Realtime for Orders Table
-- ============================================================================
-- This allows the user profile to receive real-time order status updates
-- when admin changes order status

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;
