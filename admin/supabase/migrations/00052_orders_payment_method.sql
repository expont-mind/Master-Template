-- Add payment_method column to orders table
-- Values: 'qpay', 'lendmn', 'transfer'

-- Create enum type for payment method
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('qpay', 'lendmn', 'transfer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add payment_method column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'transfer';

-- Add comment
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: qpay, lendmn, or transfer (manual bank transfer)';
