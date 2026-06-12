-- Add provider and external_invoice_number columns for LendMN integration
ALTER TABLE payment_invoices
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'qpay';

ALTER TABLE payment_invoices
  ADD COLUMN IF NOT EXISTS external_invoice_number text;

CREATE INDEX IF NOT EXISTS idx_payment_invoices_external_invoice_number
  ON payment_invoices(external_invoice_number) WHERE external_invoice_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_invoices_provider
  ON payment_invoices(provider);
