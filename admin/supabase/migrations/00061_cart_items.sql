-- Cart items table for server-side cart persistence (cross-device sync)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraints (split for NULL variant_id handling)
CREATE UNIQUE INDEX cart_items_user_product_variant_idx
    ON cart_items (user_id, product_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX cart_items_user_product_no_variant_idx
    ON cart_items (user_id, product_id) WHERE variant_id IS NULL;

-- Performance
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- Updated_at trigger
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_items_insert" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_update" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_items_delete" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);
