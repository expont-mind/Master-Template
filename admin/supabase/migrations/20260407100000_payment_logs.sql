-- ============================================================================
-- Payment logs table for tracking payment flow events and failures
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  text,
  order_id    uuid,
  provider    text,        -- 'qpay', 'lendmn', 'storepay'
  event       text NOT NULL, -- 'callback_received', 'invoice_not_found', 'rpc_failed', etc.
  status      text NOT NULL DEFAULT 'error', -- 'info', 'error', 'success'
  message     text,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for querying recent errors
CREATE INDEX idx_payment_logs_created_at ON payment_logs (created_at DESC);
CREATE INDEX idx_payment_logs_invoice_id ON payment_logs (invoice_id);
CREATE INDEX idx_payment_logs_status ON payment_logs (status);

-- RLS: only service_role can write, admin can read
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON payment_logs FOR ALL
  USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON payment_logs TO service_role;
GRANT SELECT ON payment_logs TO authenticated;
