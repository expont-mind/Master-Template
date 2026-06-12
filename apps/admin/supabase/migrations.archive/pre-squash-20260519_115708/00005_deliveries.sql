-- ============================================================================
-- МОДУЛЬ: ХҮРГЭЛТИЙН ТОХИРГОО (DELIVERY SETTINGS)
-- Delivery zones, pricing, and configuration
-- ============================================================================

-- Хүргэлтийн бүсийн хүснэгт
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Бүсийн мэдээлэл
    name VARCHAR(100) NOT NULL,              -- Бүсийн нэр (жишээ: "Улаанбаатар", "Орон нутаг")
    description TEXT,                         -- Тайлбар

    -- Хүргэлтийн үнэ
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Үнэгүй хүргэлтийн тохиргоо
    free_delivery_threshold NUMERIC(12,2),   -- Үнэгүй хүргэлтийн босго дүн
    is_free_delivery_enabled BOOLEAN DEFAULT FALSE,

    -- Хүргэлтийн хугацаа (өдрөөр)
    estimated_days_min INT DEFAULT 1,
    estimated_days_max INT DEFAULT 3,

    -- Идэвхтэй эсэх
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_delivery_zones_sort ON delivery_zones(sort_order);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Зөвхөн authenticated хэрэглэгчдэд бүх эрх олгох
CREATE POLICY "delivery_zones_select" ON delivery_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "delivery_zones_insert" ON delivery_zones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "delivery_zones_update" ON delivery_zones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delivery_zones_delete" ON delivery_zones FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO delivery_zones (name, description, delivery_fee, free_delivery_threshold, is_free_delivery_enabled, estimated_days_min, estimated_days_max, sort_order) VALUES
    ('Улаанбаатар', 'Улаанбаатар хот доторх хүргэлт', 5000, 50000, true, 1, 2, 1),
    ('Орон нутаг', 'Аймаг, сумдын хүргэлт', 15000, 100000, true, 3, 7, 2);

-- ============================================================================
-- DONE!
-- ============================================================================
