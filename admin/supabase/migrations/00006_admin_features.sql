-- ============================================================================
-- МОНПАНГ ADMIN FEATURES MIGRATION
-- New tables for admin panel features: bank_accounts, banners, coupons,
-- branches, ads, about_sections, sms_campaigns, stock_history, settings
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE banner_position AS ENUM ('home_hero', 'home_secondary', 'category', 'product', 'checkout');
CREATE TYPE banner_link_type AS ENUM ('product', 'category', 'external', 'none');
CREATE TYPE coupon_type AS ENUM ('fixed', 'percentage', 'free_shipping');
CREATE TYPE coupon_scope AS ENUM ('all', 'category', 'product', 'brand');
CREATE TYPE ad_position AS ENUM ('home', 'category', 'product', 'search', 'checkout');
CREATE TYPE sms_campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- ============================================================================
-- БАНКНЫ ДАНС (Bank Accounts)
-- ============================================================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MNT',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX idx_bank_accounts_default ON bank_accounts(is_default) WHERE is_default = TRUE;

-- ============================================================================
-- БАННЕР (Banners)
-- ============================================================================

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    position banner_position DEFAULT 'home_hero',
    link_type banner_link_type DEFAULT 'none',
    link_url TEXT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    sort_order INT DEFAULT 0,
    click_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_active ON banners(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_banners_dates ON banners(start_date, end_date);

-- ============================================================================
-- КУПОН (Coupons)
-- ============================================================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type coupon_type NOT NULL DEFAULT 'percentage',
    scope coupon_scope NOT NULL DEFAULT 'all',
    discount_value NUMERIC(12,2) NOT NULL,
    min_purchase_amount NUMERIC(12,2),
    max_discount_amount NUMERIC(12,2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    usage_limit_per_user INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_coupons_dates ON coupons(start_date, end_date);

-- Coupon Products (for product scope)
CREATE TABLE coupon_products (
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, product_id)
);

-- Coupon Categories (for category scope)
CREATE TABLE coupon_categories (
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, category_id)
);

-- Coupon Usages
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount NUMERIC(12,2) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);

-- ============================================================================
-- САЛБАР (Branches)
-- ============================================================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    working_hours JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX idx_branches_main ON branches(is_main) WHERE is_main = TRUE;

-- Branch Inventory
CREATE TABLE branch_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT branch_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT branch_reserved_non_negative CHECK (reserved_quantity >= 0),
    UNIQUE (branch_id, product_id, variant_id)
);

-- ============================================================================
-- ЗАР СУРТАЛЧИЛГАА (Ads)
-- ============================================================================

CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    position ad_position DEFAULT 'home',
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    click_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_ads_position ON ads(position);
CREATE INDEX idx_ads_active ON ads(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- БИДНИЙ ТУХАЙ (About Us)
-- ============================================================================

CREATE TABLE about_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT,
    section_type VARCHAR(50) DEFAULT 'general',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_about_sections_updated_at BEFORE UPDATE ON about_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team Members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    bio TEXT,
    image_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    social_links JSONB,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SMS КАМПАНИТ АЖИЛ (SMS Campaigns)
-- ============================================================================

CREATE TABLE sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status sms_campaign_status DEFAULT 'draft',
    recipient_filter JSONB,
    recipient_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_sms_campaigns_status ON sms_campaigns(status);

-- SMS Logs
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_campaign ON sms_logs(campaign_id);
CREATE INDEX idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX idx_sms_logs_phone ON sms_logs(phone);

-- ============================================================================
-- АГУУЛАХЫН ТҮҮХ (Stock History)
-- ============================================================================

CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    note TEXT,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_history_product ON stock_history(product_id);
CREATE INDEX idx_stock_history_variant ON stock_history(variant_id);
CREATE INDEX idx_stock_history_branch ON stock_history(branch_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at DESC);

-- ============================================================================
-- ТОХИРГОО (Settings)
-- ============================================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    group_name VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_group ON settings(group_name);

-- Default settings
INSERT INTO settings (key, value, description, group_name, is_public) VALUES
    ('store_name', '"Монпанг"', 'Дэлгүүрийн нэр', 'general', true),
    ('store_phone', '""', 'Холбогдох утас', 'general', true),
    ('store_email', '""', 'Холбогдох имэйл', 'general', true),
    ('store_address', '""', 'Хаяг', 'general', true),
    ('currency', '"MNT"', 'Валют', 'general', true),
    ('min_order_amount', '0', 'Захиалгын доод дүн', 'order', false),
    ('free_shipping_threshold', '0', 'Үнэгүй хүргэлтийн босго', 'shipping', false),
    ('default_shipping_fee', '5000', 'Хүргэлтийн үндсэн төлбөр', 'shipping', false);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Bank Accounts (public read active, authenticated write)
CREATE POLICY "bank_accounts_select" ON bank_accounts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "bank_accounts_insert" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bank_accounts_update" ON bank_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bank_accounts_delete" ON bank_accounts FOR DELETE TO authenticated USING (true);

-- Banners (public read active, authenticated write)
CREATE POLICY "banners_select" ON banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "banners_insert" ON banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "banners_update" ON banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "banners_delete" ON banners FOR DELETE TO authenticated USING (true);

-- Coupons (public read active, authenticated write)
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "coupons_insert" ON coupons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coupons_update" ON coupons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "coupons_delete" ON coupons FOR DELETE TO authenticated USING (true);

-- Coupon Products (authenticated only)
CREATE POLICY "coupon_products_select" ON coupon_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupon_products_insert" ON coupon_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coupon_products_delete" ON coupon_products FOR DELETE TO authenticated USING (true);

-- Coupon Categories (authenticated only)
CREATE POLICY "coupon_categories_select" ON coupon_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupon_categories_insert" ON coupon_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coupon_categories_delete" ON coupon_categories FOR DELETE TO authenticated USING (true);

-- Coupon Usages (own only)
CREATE POLICY "coupon_usages_select_own" ON coupon_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coupon_usages_insert" ON coupon_usages FOR INSERT TO authenticated WITH CHECK (true);

-- Branches (public read active, authenticated write)
CREATE POLICY "branches_select" ON branches FOR SELECT USING (is_active = TRUE);
CREATE POLICY "branches_insert" ON branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "branches_update" ON branches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "branches_delete" ON branches FOR DELETE TO authenticated USING (true);

-- Branch Inventory (authenticated only)
CREATE POLICY "branch_inventory_select" ON branch_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "branch_inventory_insert" ON branch_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "branch_inventory_update" ON branch_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "branch_inventory_delete" ON branch_inventory FOR DELETE TO authenticated USING (true);

-- Ads (public read active, authenticated write)
CREATE POLICY "ads_select" ON ads FOR SELECT USING (is_active = TRUE);
CREATE POLICY "ads_insert" ON ads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ads_update" ON ads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ads_delete" ON ads FOR DELETE TO authenticated USING (true);

-- About Sections (public read active, authenticated write)
CREATE POLICY "about_sections_select" ON about_sections FOR SELECT USING (is_active = TRUE);
CREATE POLICY "about_sections_insert" ON about_sections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "about_sections_update" ON about_sections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "about_sections_delete" ON about_sections FOR DELETE TO authenticated USING (true);

-- Team Members (public read active, authenticated write)
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (is_active = TRUE);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team_members_update" ON team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE TO authenticated USING (true);

-- SMS Campaigns (authenticated only)
CREATE POLICY "sms_campaigns_select" ON sms_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "sms_campaigns_insert" ON sms_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sms_campaigns_update" ON sms_campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sms_campaigns_delete" ON sms_campaigns FOR DELETE TO authenticated USING (true);

-- SMS Logs (authenticated only)
CREATE POLICY "sms_logs_select" ON sms_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "sms_logs_insert" ON sms_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Stock History (authenticated only)
CREATE POLICY "stock_history_select" ON stock_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_history_insert" ON stock_history FOR INSERT TO authenticated WITH CHECK (true);

-- Settings (public read public settings, authenticated write)
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (is_public = TRUE);
CREATE POLICY "settings_select_all" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_insert" ON settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settings_update" ON settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "settings_delete" ON settings FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- DONE!
-- ============================================================================
