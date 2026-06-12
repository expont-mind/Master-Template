-- Point transaction types
DO $$ BEGIN
    CREATE TYPE point_transaction_type AS ENUM ('earned', 'used', 'promotional', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Point transactions table (source of truth for balance via SUM)
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID REFERENCES orders(id),
    type point_transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- positive for earned/promo, negative for used
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_order ON point_transactions(order_id);

-- RLS policies
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own point transactions"
        ON point_transactions FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
