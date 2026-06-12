-- ============================================================================
-- INITIAL SCHEMA — Consolidated from 141 individual migrations
-- ============================================================================
--
-- Generated: 2026-05-13
-- Original migration files: apps/admin/supabase/migrations.archive/pre-squash-*/
--
-- This file is the result of concatenating 141 development-era migrations
-- into a single push for new client deployments. Schema state is identical
-- to running all original migrations in order — they have not been hand-
-- rewritten, only assembled.
--
-- Notes:
-- 1. CREATE INDEX CONCURRENTLY → CREATE INDEX
--    Fresh databases have no concurrent traffic; concurrency is unnecessary
--    and would force the migration to run outside a transaction.
--    If you ever need to add an index on a live client DB, do it manually
--    via Supabase Studio with CREATE INDEX CONCURRENTLY.
--
-- 2. apply_product_details.sql (hand-applied patch) is NOT included here.
--    It was a one-off SQL Editor patch that has since been superseded by
--    migrations 00022 and 00023.
--
-- 3. Section headers below show the original filename for traceability.
--
-- For full migration history with individual file granularity, see
-- migrations.archive/.
-- ============================================================================


-- ============================================================================
-- 00001_complete_schema.sql
-- ============================================================================

-- ============================================================================
-- МОНПАНГ БҮРЭН SCHEMA + PRODUCT VARIANTS
-- Complete Mobile App Database Schema with Taobao-style Variants
-- ============================================================================

-- ============================================================================
-- МОДУЛЬ 1: ТОХИРГОО
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUM Төрлүүд
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'canceled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'processing', 'paid', 'failed');
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE review_status AS ENUM ('active', 'hidden', 'flagged');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE notification_type AS ENUM ('order', 'payment', 'promotion', 'system');
CREATE TYPE admin_role AS ENUM ('super_admin', 'operator', 'content_manager', 'support');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- ============================================================================
-- МОДУЛЬ 2: ХЭРЭГЛЭГЧ
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR UNIQUE,
    full_name VARCHAR NOT NULL,
    avatar_url TEXT,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    device_info JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

-- ============================================================================
-- МОДУЛЬ 3: БҮТЭЭГДЭХҮҮН
-- ============================================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    logo_url TEXT
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    discount_price NUMERIC(12,2),
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    status product_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);

CREATE TABLE product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT reserved_non_negative CHECK (reserved_quantity >= 0)
);

-- ============================================================================
-- МОДУЛЬ 4: PRODUCT VARIANTS (Taobao-style)
-- ============================================================================

-- Attribute types (Size, Color, Material)
CREATE TABLE product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attribute values (S, M, L, Red, Blue)
CREATE TABLE product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    display_value VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7),
    image_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(attribute_id, value)
);

CREATE INDEX idx_attr_values_attribute ON product_attribute_values(attribute_id);

-- Product attribute configs
CREATE TABLE product_attribute_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    UNIQUE(product_id, attribute_id)
);

-- Product variants (SKU)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    price NUMERIC(12,2) NOT NULL,
    discount_price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    weight NUMERIC(10,3),
    barcode VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    status product_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT variant_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT variant_reserved_non_negative CHECK (reserved_quantity >= 0)
);

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_variants_status ON product_variants(status);
CREATE UNIQUE INDEX idx_variants_default ON product_variants(product_id) WHERE is_default = TRUE;

-- Variant attributes junction
CREATE TABLE product_variant_attributes (
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id UUID REFERENCES product_attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_variant ON product_images(variant_id) WHERE variant_id IS NOT NULL;

-- ============================================================================
-- МОДУЛЬ 5: WISHLIST
-- ============================================================================

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR DEFAULT 'Default',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlist_items (
    wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (wishlist_id, product_id)
);

-- ============================================================================
-- МОДУЛЬ 6: REVIEWS
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status review_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================================================
-- МОДУЛЬ 7: ORDERS
-- ============================================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'pending',
    total_amount NUMERIC(12,2) NOT NULL,
    payment_status payment_status DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    variant_name VARCHAR(255),
    price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- ============================================================================
-- МОДУЛЬ 8: PAYMENTS
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider VARCHAR NOT NULL DEFAULT 'BONUM',
    amount NUMERIC(12,2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    transaction_ref VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ 9: NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR,
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ 10: ADDRESSES
-- ============================================================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR,
    district VARCHAR,
    detail TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ 11: CONTENT
-- ============================================================================

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    slug VARCHAR UNIQUE,
    content TEXT,
    status content_status DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    description TEXT,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ 12: ADMIN
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ 13: SEED DATA
-- ============================================================================

-- Default attributes
INSERT INTO product_attributes (name, display_name, sort_order) VALUES
    ('color', 'Өнгө', 1),
    ('size', 'Хэмжээ', 2),
    ('material', 'Материал', 3);

-- Default colors
INSERT INTO product_attribute_values (attribute_id, value, display_value, color_hex, sort_order)
SELECT id, 'black', 'Хар', '#000000', 1 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'white', 'Цагаан', '#FFFFFF', 2 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'red', 'Улаан', '#FF0000', 3 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'blue', 'Цэнхэр', '#0000FF', 4 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'green', 'Ногоон', '#00FF00', 5 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'yellow', 'Шар', '#FFFF00', 6 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'pink', 'Ягаан', '#FFC0CB', 7 FROM product_attributes WHERE name = 'color'
UNION ALL SELECT id, 'gray', 'Саарал', '#808080', 8 FROM product_attributes WHERE name = 'color';

-- Default sizes
INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order)
SELECT id, 'xs', 'XS', 1 FROM product_attributes WHERE name = 'size'
UNION ALL SELECT id, 's', 'S', 2 FROM product_attributes WHERE name = 'size'
UNION ALL SELECT id, 'm', 'M', 3 FROM product_attributes WHERE name = 'size'
UNION ALL SELECT id, 'l', 'L', 4 FROM product_attributes WHERE name = 'size'
UNION ALL SELECT id, 'xl', 'XL', 5 FROM product_attributes WHERE name = 'size'
UNION ALL SELECT id, 'xxl', 'XXL', 6 FROM product_attributes WHERE name = 'size';

-- ============================================================================
-- МОДУЛЬ 14: RLS POLICIES
-- ============================================================================

-- RLS идэвхжүүлэх
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- AUTH SESSIONS
-- ============================================================================
CREATE POLICY "sessions_select_own" ON auth_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON auth_sessions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- ADDRESSES
-- ============================================================================
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTS (public read, authenticated write)
-- ============================================================================
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- CATEGORIES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- BRANDS (public read, authenticated write)
-- ============================================================================
CREATE POLICY "brands_select" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_insert" ON brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "brands_update" ON brands FOR UPDATE TO authenticated USING (true);
CREATE POLICY "brands_delete" ON brands FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT_CATEGORIES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_categories_select" ON product_categories FOR SELECT USING (true);
CREATE POLICY "product_categories_insert" ON product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_categories_delete" ON product_categories FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- INVENTORY (public read, authenticated write)
-- ============================================================================
CREATE POLICY "inventory_select" ON inventory FOR SELECT USING (true);
CREATE POLICY "inventory_insert" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventory_update" ON inventory FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT ATTRIBUTES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_attributes_select" ON product_attributes FOR SELECT USING (true);
CREATE POLICY "product_attributes_insert" ON product_attributes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_attributes_update" ON product_attributes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "product_attributes_delete" ON product_attributes FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT ATTRIBUTE VALUES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_attribute_values_select" ON product_attribute_values FOR SELECT USING (true);
CREATE POLICY "product_attribute_values_insert" ON product_attribute_values FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_attribute_values_update" ON product_attribute_values FOR UPDATE TO authenticated USING (true);
CREATE POLICY "product_attribute_values_delete" ON product_attribute_values FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT ATTRIBUTE CONFIGS (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_attribute_configs_select" ON product_attribute_configs FOR SELECT USING (true);
CREATE POLICY "product_attribute_configs_insert" ON product_attribute_configs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_attribute_configs_update" ON product_attribute_configs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "product_attribute_configs_delete" ON product_attribute_configs FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT VARIANTS (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_variants_select" ON product_variants FOR SELECT USING (true);
CREATE POLICY "product_variants_insert" ON product_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_variants_update" ON product_variants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "product_variants_delete" ON product_variants FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT VARIANT ATTRIBUTES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_variant_attributes_select" ON product_variant_attributes FOR SELECT USING (true);
CREATE POLICY "product_variant_attributes_insert" ON product_variant_attributes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_variant_attributes_delete" ON product_variant_attributes FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PRODUCT IMAGES (public read, authenticated write)
-- ============================================================================
CREATE POLICY "product_images_select" ON product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert" ON product_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_images_update" ON product_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "product_images_delete" ON product_images FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- WISHLISTS (own only)
-- ============================================================================
CREATE POLICY "wishlists_select_own" ON wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_insert_own" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_update_own" ON wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishlists_delete_own" ON wishlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "wishlist_items_select" ON wishlist_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()));
CREATE POLICY "wishlist_items_insert" ON wishlist_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()));
CREATE POLICY "wishlist_items_delete" ON wishlist_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()));

-- ============================================================================
-- REVIEWS (public read active, own write)
-- ============================================================================
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (status = 'active');
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ORDERS (own only)
-- ============================================================================
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "order_items_select" ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));

-- ============================================================================
-- PAYMENTS (own orders only)
-- ============================================================================
CREATE POLICY "payments_select" ON payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));

-- ============================================================================
-- NOTIFICATIONS (own only)
-- ============================================================================
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- CONTENT (public read published)
-- ============================================================================
CREATE POLICY "articles_select" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "articles_insert" ON articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "articles_update" ON articles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "events_select" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- ADMIN TABLES (authenticated only)
-- ============================================================================
CREATE POLICY "roles_select" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roles_update" ON roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "roles_delete" ON roles FOR DELETE TO authenticated USING (true);

CREATE POLICY "permissions_select" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_insert" ON permissions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_insert" ON role_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "role_permissions_delete" ON role_permissions FOR DELETE TO authenticated USING (true);

CREATE POLICY "admins_select" ON admins FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins_insert" ON admins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admins_update" ON admins FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- DONE!
-- ============================================================================

-- ============================================================================
-- 00003_faqs.sql
-- ============================================================================

-- ============================================================================
-- FAQ (Frequently Asked Questions) TABLE
-- ============================================================================

-- Create FAQ status enum (reusing content_status for consistency)
-- content_status already exists: draft, published, archived

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    sort_order INT DEFAULT 0,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);

-- Grant permissions
GRANT ALL ON faqs TO anon, authenticated, service_role;

-- Disable RLS for admin access (you can enable and add policies later)
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE faqs IS 'Frequently Asked Questions for the platform';

-- ============================================================================
-- 00004_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- RLS POLICIES - COMPLETE CONFIGURATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================================================

-- Users
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

-- Auth Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "auth_sessions_select" ON auth_sessions;
DROP POLICY IF EXISTS "auth_sessions_delete" ON auth_sessions;

-- Products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products are editable by authenticated users" ON products;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;

-- Categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories are editable by authenticated users" ON categories;
DROP POLICY IF EXISTS "categories_select" ON categories;

-- Brands
DROP POLICY IF EXISTS "Brands are viewable by everyone" ON brands;
DROP POLICY IF EXISTS "Brands are editable by authenticated users" ON brands;
DROP POLICY IF EXISTS "brands_select" ON brands;

-- Product Categories
DROP POLICY IF EXISTS "Product categories are viewable by everyone" ON product_categories;
DROP POLICY IF EXISTS "product_categories_select" ON product_categories;

-- Inventory
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON inventory;
DROP POLICY IF EXISTS "inventory_select" ON inventory;

-- Product Attributes
DROP POLICY IF EXISTS "Product attributes are viewable by everyone" ON product_attributes;
DROP POLICY IF EXISTS "product_attributes_select" ON product_attributes;

-- Product Attribute Values
DROP POLICY IF EXISTS "Product attribute values are viewable by everyone" ON product_attribute_values;
DROP POLICY IF EXISTS "product_attribute_values_select" ON product_attribute_values;

-- Product Attribute Configs
DROP POLICY IF EXISTS "Product attribute configs are viewable by everyone" ON product_attribute_configs;
DROP POLICY IF EXISTS "product_attribute_configs_select" ON product_attribute_configs;

-- Product Variants
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "product_variants_select" ON product_variants;

-- Product Variant Attributes
DROP POLICY IF EXISTS "Product variant attributes are viewable by everyone" ON product_variant_attributes;
DROP POLICY IF EXISTS "product_variant_attributes_select" ON product_variant_attributes;

-- Product Images
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON product_images;
DROP POLICY IF EXISTS "product_images_select" ON product_images;

-- Wishlists
DROP POLICY IF EXISTS "Users can view own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can create own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can update own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlists" ON wishlists;
DROP POLICY IF EXISTS "wishlists_all" ON wishlists;
DROP POLICY IF EXISTS "wishlists_select" ON wishlists;
DROP POLICY IF EXISTS "wishlists_insert" ON wishlists;
DROP POLICY IF EXISTS "wishlists_update" ON wishlists;
DROP POLICY IF EXISTS "wishlists_delete" ON wishlists;

-- Wishlist Items
DROP POLICY IF EXISTS "Users can manage own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_all" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_select" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_insert" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_delete" ON wishlist_items;

-- Reviews
DROP POLICY IF EXISTS "Published reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;
DROP POLICY IF EXISTS "reviews_delete" ON reviews;

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "order_items_select" ON order_items;

-- Payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;

-- Addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
DROP POLICY IF EXISTS "addresses_all" ON addresses;
DROP POLICY IF EXISTS "addresses_select" ON addresses;
DROP POLICY IF EXISTS "addresses_insert" ON addresses;
DROP POLICY IF EXISTS "addresses_update" ON addresses;
DROP POLICY IF EXISTS "addresses_delete" ON addresses;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

-- Articles
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON articles;
DROP POLICY IF EXISTS "articles_select" ON articles;

-- Events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "events_select" ON events;

-- FAQs
DROP POLICY IF EXISTS "Published faqs are viewable by everyone" ON faqs;
DROP POLICY IF EXISTS "faqs_select" ON faqs;

-- Admin tables
DROP POLICY IF EXISTS "Admins are viewable by authenticated users" ON admins;
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
DROP POLICY IF EXISTS "Permissions are viewable by authenticated users" ON permissions;
DROP POLICY IF EXISTS "Role permissions are viewable by authenticated users" ON role_permissions;

-- ============================================================================
-- 3. CREATE NEW POLICIES
-- ============================================================================

-- ======================== CATALOG TABLES (Public Read) ========================

-- PRODUCTS: Public read (all statuses for now, can restrict to active later)
CREATE POLICY "products_select" ON products
  FOR SELECT USING (true);

-- CATEGORIES: Public read all
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (true);

-- BRANDS: Public read all
CREATE POLICY "brands_select" ON brands
  FOR SELECT USING (true);

-- PRODUCT_CATEGORIES: Public read all
CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT USING (true);

-- INVENTORY: Public read all
CREATE POLICY "inventory_select" ON inventory
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTES: Public read all
CREATE POLICY "product_attributes_select" ON product_attributes
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTE_VALUES: Public read all
CREATE POLICY "product_attribute_values_select" ON product_attribute_values
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTE_CONFIGS: Public read all
CREATE POLICY "product_attribute_configs_select" ON product_attribute_configs
  FOR SELECT USING (true);

-- PRODUCT_VARIANTS: Public read all
CREATE POLICY "product_variants_select" ON product_variants
  FOR SELECT USING (true);

-- PRODUCT_VARIANT_ATTRIBUTES: Public read all
CREATE POLICY "product_variant_attributes_select" ON product_variant_attributes
  FOR SELECT USING (true);

-- PRODUCT_IMAGES: Public read all
CREATE POLICY "product_images_select" ON product_images
  FOR SELECT USING (true);

-- ======================== USER TABLES ========================

-- USERS: Public read, authenticated can update own
CREATE POLICY "users_select" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- AUTH_SESSIONS: Own access only
CREATE POLICY "auth_sessions_select" ON auth_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "auth_sessions_delete" ON auth_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ======================== USER-OWNED DATA ========================

-- ORDERS: Own read/insert
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER_ITEMS: Via order ownership
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- PAYMENTS: Via order ownership
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ADDRESSES: Own CRUD
CREATE POLICY "addresses_select" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- WISHLISTS: Own CRUD
CREATE POLICY "wishlists_select" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlists_insert" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_update" ON wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wishlists_delete" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- WISHLIST_ITEMS: Via wishlist ownership
CREATE POLICY "wishlist_items_select" ON wishlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_insert" ON wishlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_delete" ON wishlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

-- NOTIFICATIONS: Own read/update
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ======================== REVIEWS ========================

-- Public can read active reviews
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (status = 'active');

-- Users can insert own reviews
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "reviews_delete" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ======================== CONTENT TABLES (Public Read Published) ========================

-- ARTICLES: Public read published only
CREATE POLICY "articles_select" ON articles
  FOR SELECT USING (status = 'published');

-- EVENTS: Public read published only
CREATE POLICY "events_select" ON events
  FOR SELECT USING (status = 'published');

-- FAQS: Public read published only
CREATE POLICY "faqs_select" ON faqs
  FOR SELECT USING (status = 'published');

-- ======================== ADMIN TABLES ========================
-- No policies = no public access
-- service_role key bypasses RLS, so admin API routes will work

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'RLS Policies configured successfully!' as message;

-- Show tables with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 00005_deliveries.sql
-- ============================================================================

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

-- ============================================================================
-- 00006_admin_features.sql
-- ============================================================================

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

-- ============================================================================
-- 00007_drop_price_rules.sql
-- ============================================================================

-- ============================================================================
-- DROP PRICE RULES
-- ============================================================================

-- Drop RLS policies
DROP POLICY IF EXISTS "price_rule_categories_delete" ON price_rule_categories;
DROP POLICY IF EXISTS "price_rule_categories_insert" ON price_rule_categories;
DROP POLICY IF EXISTS "price_rule_categories_select" ON price_rule_categories;

DROP POLICY IF EXISTS "price_rule_products_delete" ON price_rule_products;
DROP POLICY IF EXISTS "price_rule_products_insert" ON price_rule_products;
DROP POLICY IF EXISTS "price_rule_products_select" ON price_rule_products;

DROP POLICY IF EXISTS "price_rules_delete" ON price_rules;
DROP POLICY IF EXISTS "price_rules_update" ON price_rules;
DROP POLICY IF EXISTS "price_rules_insert" ON price_rules;
DROP POLICY IF EXISTS "price_rules_select" ON price_rules;

-- Drop tables (junction tables first due to FK)
DROP TABLE IF EXISTS price_rule_categories;
DROP TABLE IF EXISTS price_rule_products;
DROP TABLE IF EXISTS price_rules;

-- Drop enum types
DROP TYPE IF EXISTS price_rule_scope;
DROP TYPE IF EXISTS price_rule_type;

-- ============================================================================
-- 00008_rls_reset.sql
-- ============================================================================

-- ============================================================================
-- RLS БҮРЭН ШИНЭЧЛЭЛ
-- Хуучин бүх policy устгаж, зөв дахин үүсгэнэ
-- ============================================================================

-- ============================================================================
-- 1. БҮГДИЙГ УСТГАХ
-- ============================================================================

-- Users
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;

-- Auth Sessions
DROP POLICY IF EXISTS "auth_sessions_select" ON auth_sessions;
DROP POLICY IF EXISTS "auth_sessions_delete" ON auth_sessions;
DROP POLICY IF EXISTS "sessions_select_own" ON auth_sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON auth_sessions;

-- Addresses
DROP POLICY IF EXISTS "addresses_select" ON addresses;
DROP POLICY IF EXISTS "addresses_insert" ON addresses;
DROP POLICY IF EXISTS "addresses_update" ON addresses;
DROP POLICY IF EXISTS "addresses_delete" ON addresses;
DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;

-- Products
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;

-- Categories
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

-- Brands
DROP POLICY IF EXISTS "brands_select" ON brands;
DROP POLICY IF EXISTS "brands_insert" ON brands;
DROP POLICY IF EXISTS "brands_update" ON brands;
DROP POLICY IF EXISTS "brands_delete" ON brands;

-- Product Categories
DROP POLICY IF EXISTS "product_categories_select" ON product_categories;
DROP POLICY IF EXISTS "product_categories_insert" ON product_categories;
DROP POLICY IF EXISTS "product_categories_delete" ON product_categories;

-- Inventory
DROP POLICY IF EXISTS "inventory_select" ON inventory;
DROP POLICY IF EXISTS "inventory_insert" ON inventory;
DROP POLICY IF EXISTS "inventory_update" ON inventory;

-- Product Attributes
DROP POLICY IF EXISTS "product_attributes_select" ON product_attributes;
DROP POLICY IF EXISTS "product_attributes_insert" ON product_attributes;
DROP POLICY IF EXISTS "product_attributes_update" ON product_attributes;
DROP POLICY IF EXISTS "product_attributes_delete" ON product_attributes;

-- Product Attribute Values
DROP POLICY IF EXISTS "product_attribute_values_select" ON product_attribute_values;
DROP POLICY IF EXISTS "product_attribute_values_insert" ON product_attribute_values;
DROP POLICY IF EXISTS "product_attribute_values_update" ON product_attribute_values;
DROP POLICY IF EXISTS "product_attribute_values_delete" ON product_attribute_values;

-- Product Attribute Configs
DROP POLICY IF EXISTS "product_attribute_configs_select" ON product_attribute_configs;
DROP POLICY IF EXISTS "product_attribute_configs_insert" ON product_attribute_configs;
DROP POLICY IF EXISTS "product_attribute_configs_update" ON product_attribute_configs;
DROP POLICY IF EXISTS "product_attribute_configs_delete" ON product_attribute_configs;

-- Product Variants
DROP POLICY IF EXISTS "product_variants_select" ON product_variants;
DROP POLICY IF EXISTS "product_variants_insert" ON product_variants;
DROP POLICY IF EXISTS "product_variants_update" ON product_variants;
DROP POLICY IF EXISTS "product_variants_delete" ON product_variants;

-- Product Variant Attributes
DROP POLICY IF EXISTS "product_variant_attributes_select" ON product_variant_attributes;
DROP POLICY IF EXISTS "product_variant_attributes_insert" ON product_variant_attributes;
DROP POLICY IF EXISTS "product_variant_attributes_delete" ON product_variant_attributes;

-- Product Images
DROP POLICY IF EXISTS "product_images_select" ON product_images;
DROP POLICY IF EXISTS "product_images_insert" ON product_images;
DROP POLICY IF EXISTS "product_images_update" ON product_images;
DROP POLICY IF EXISTS "product_images_delete" ON product_images;

-- Wishlists
DROP POLICY IF EXISTS "wishlists_select" ON wishlists;
DROP POLICY IF EXISTS "wishlists_insert" ON wishlists;
DROP POLICY IF EXISTS "wishlists_update" ON wishlists;
DROP POLICY IF EXISTS "wishlists_delete" ON wishlists;
DROP POLICY IF EXISTS "wishlists_select_own" ON wishlists;
DROP POLICY IF EXISTS "wishlists_insert_own" ON wishlists;
DROP POLICY IF EXISTS "wishlists_update_own" ON wishlists;
DROP POLICY IF EXISTS "wishlists_delete_own" ON wishlists;

-- Wishlist Items
DROP POLICY IF EXISTS "wishlist_items_select" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_insert" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_delete" ON wishlist_items;

-- Reviews
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;
DROP POLICY IF EXISTS "reviews_delete" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;

-- Orders
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;

-- Order Items
DROP POLICY IF EXISTS "order_items_select" ON order_items;

-- Payments
DROP POLICY IF EXISTS "payments_select" ON payments;

-- Notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- Articles
DROP POLICY IF EXISTS "articles_select" ON articles;
DROP POLICY IF EXISTS "articles_insert" ON articles;
DROP POLICY IF EXISTS "articles_update" ON articles;

-- Events
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;

-- FAQs
DROP POLICY IF EXISTS "faqs_select" ON faqs;

-- Admin tables
DROP POLICY IF EXISTS "roles_select" ON roles;
DROP POLICY IF EXISTS "roles_insert" ON roles;
DROP POLICY IF EXISTS "roles_update" ON roles;
DROP POLICY IF EXISTS "roles_delete" ON roles;
DROP POLICY IF EXISTS "permissions_select" ON permissions;
DROP POLICY IF EXISTS "permissions_insert" ON permissions;
DROP POLICY IF EXISTS "role_permissions_select" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete" ON role_permissions;
DROP POLICY IF EXISTS "admins_select" ON admins;
DROP POLICY IF EXISTS "admins_insert" ON admins;
DROP POLICY IF EXISTS "admins_update" ON admins;

-- Delivery Zones
DROP POLICY IF EXISTS "delivery_zones_select" ON delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_insert" ON delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_update" ON delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_delete" ON delivery_zones;

-- Bank Accounts
DROP POLICY IF EXISTS "bank_accounts_select" ON bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_insert" ON bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_update" ON bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_delete" ON bank_accounts;

-- Banners
DROP POLICY IF EXISTS "banners_select" ON banners;
DROP POLICY IF EXISTS "banners_insert" ON banners;
DROP POLICY IF EXISTS "banners_update" ON banners;
DROP POLICY IF EXISTS "banners_delete" ON banners;

-- Coupons
DROP POLICY IF EXISTS "coupons_select" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;
DROP POLICY IF EXISTS "coupon_products_select" ON coupon_products;
DROP POLICY IF EXISTS "coupon_products_insert" ON coupon_products;
DROP POLICY IF EXISTS "coupon_products_delete" ON coupon_products;
DROP POLICY IF EXISTS "coupon_categories_select" ON coupon_categories;
DROP POLICY IF EXISTS "coupon_categories_insert" ON coupon_categories;
DROP POLICY IF EXISTS "coupon_categories_delete" ON coupon_categories;
DROP POLICY IF EXISTS "coupon_usages_select_own" ON coupon_usages;
DROP POLICY IF EXISTS "coupon_usages_insert" ON coupon_usages;

-- Branches
DROP POLICY IF EXISTS "branches_select" ON branches;
DROP POLICY IF EXISTS "branches_insert" ON branches;
DROP POLICY IF EXISTS "branches_update" ON branches;
DROP POLICY IF EXISTS "branches_delete" ON branches;
DROP POLICY IF EXISTS "branch_inventory_select" ON branch_inventory;
DROP POLICY IF EXISTS "branch_inventory_insert" ON branch_inventory;
DROP POLICY IF EXISTS "branch_inventory_update" ON branch_inventory;
DROP POLICY IF EXISTS "branch_inventory_delete" ON branch_inventory;

-- Ads
DROP POLICY IF EXISTS "ads_select" ON ads;
DROP POLICY IF EXISTS "ads_insert" ON ads;
DROP POLICY IF EXISTS "ads_update" ON ads;
DROP POLICY IF EXISTS "ads_delete" ON ads;

-- About Sections
DROP POLICY IF EXISTS "about_sections_select" ON about_sections;
DROP POLICY IF EXISTS "about_sections_insert" ON about_sections;
DROP POLICY IF EXISTS "about_sections_update" ON about_sections;
DROP POLICY IF EXISTS "about_sections_delete" ON about_sections;

-- Team Members
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- SMS
DROP POLICY IF EXISTS "sms_campaigns_select" ON sms_campaigns;
DROP POLICY IF EXISTS "sms_campaigns_insert" ON sms_campaigns;
DROP POLICY IF EXISTS "sms_campaigns_update" ON sms_campaigns;
DROP POLICY IF EXISTS "sms_campaigns_delete" ON sms_campaigns;
DROP POLICY IF EXISTS "sms_logs_select" ON sms_logs;
DROP POLICY IF EXISTS "sms_logs_insert" ON sms_logs;

-- Stock History
DROP POLICY IF EXISTS "stock_history_select" ON stock_history;
DROP POLICY IF EXISTS "stock_history_insert" ON stock_history;

-- Settings
DROP POLICY IF EXISTS "settings_select_public" ON settings;
DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_insert" ON settings;
DROP POLICY IF EXISTS "settings_update" ON settings;
DROP POLICY IF EXISTS "settings_delete" ON settings;

-- Warehouses
DROP POLICY IF EXISTS "warehouses_select" ON warehouses;
DROP POLICY IF EXISTS "warehouses_insert" ON warehouses;
DROP POLICY IF EXISTS "warehouses_update" ON warehouses;
DROP POLICY IF EXISTS "warehouses_delete" ON warehouses;


-- ============================================================================
-- 2. RLS ИДЭВХЖҮҮЛЭХ (бүх table-д)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. ШИНЭ POLICY ҮҮСГЭХ
-- ============================================================================

-- =====================================================================
-- КАТАЛОГ (Нийтэд нээлттэй унших, бичих хориглоно)
-- Админ = service_role key тул RLS-г бүрэн тойрч гарна
-- =====================================================================

-- PRODUCTS: Нийт хүн идэвхтэй бүтээгдэхүүн харна
CREATE POLICY "products_select" ON products
  FOR SELECT USING (status = 'active');

-- CATEGORIES: Нийт хүн бүх ангилал харна
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (true);

-- BRANDS: Нийт хүн бүх брэнд харна
CREATE POLICY "brands_select" ON brands
  FOR SELECT USING (true);

-- PRODUCT_CATEGORIES: Нийтэд нээлттэй
CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT USING (true);

-- INVENTORY: Нийтэд нээлттэй
CREATE POLICY "inventory_select" ON inventory
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTES: Нийтэд нээлттэй
CREATE POLICY "product_attributes_select" ON product_attributes
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTE_VALUES: Нийтэд нээлттэй
CREATE POLICY "product_attribute_values_select" ON product_attribute_values
  FOR SELECT USING (true);

-- PRODUCT_ATTRIBUTE_CONFIGS: Нийтэд нээлттэй
CREATE POLICY "product_attribute_configs_select" ON product_attribute_configs
  FOR SELECT USING (true);

-- PRODUCT_VARIANTS: Идэвхтэй variant-ууд
CREATE POLICY "product_variants_select" ON product_variants
  FOR SELECT USING (status = 'active');

-- PRODUCT_VARIANT_ATTRIBUTES: Нийтэд нээлттэй
CREATE POLICY "product_variant_attributes_select" ON product_variant_attributes
  FOR SELECT USING (true);

-- PRODUCT_IMAGES: Нийтэд нээлттэй
CREATE POLICY "product_images_select" ON product_images
  FOR SELECT USING (true);


-- =====================================================================
-- ХЭРЭГЛЭГЧ (Өөрийнхөө мэдээлэл)
-- =====================================================================

-- USERS: Нийт хүн profile харна, зөвхөн өөрийгөө засна
CREATE POLICY "users_select" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- AUTH_SESSIONS: Зөвхөн өөрийнх
CREATE POLICY "auth_sessions_select_own" ON auth_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "auth_sessions_delete_own" ON auth_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ADDRESSES: Зөвхөн өөрийнх (бүрэн CRUD)
CREATE POLICY "addresses_select_own" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS: Зөвхөн өөрийнх (унших, тэмдэглэх)
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);


-- =====================================================================
-- WISHLIST (Зөвхөн өөрийнх)
-- =====================================================================

CREATE POLICY "wishlists_select_own" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlists_insert_own" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_update_own" ON wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wishlists_delete_own" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "wishlist_items_select_own" ON wishlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid())
  );

CREATE POLICY "wishlist_items_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid())
  );

CREATE POLICY "wishlist_items_delete_own" ON wishlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid())
  );


-- =====================================================================
-- СЭТГЭГДЭЛ (Нийтэд идэвхтэйг харуулна, өөрийнхөө бичнэ)
-- =====================================================================

CREATE POLICY "reviews_select_active" ON reviews
  FOR SELECT USING (status = 'active');

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================================
-- ЗАХИАЛГА (Зөвхөн өөрийнх)
-- =====================================================================

CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER_ITEMS: Захиалгын эзэмшигч
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- PAYMENTS: Захиалгын эзэмшигч
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );


-- =====================================================================
-- КОНТЕНТ (Нийтэд зөвхөн нийтлэгдсэнийг)
-- =====================================================================

CREATE POLICY "articles_select_published" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "events_select_published" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "faqs_select_published" ON faqs
  FOR SELECT USING (status = 'published');


-- =====================================================================
-- ХҮРГЭЛТ (Нийтэд идэвхтэй бүсүүд)
-- =====================================================================

CREATE POLICY "delivery_zones_select_active" ON delivery_zones
  FOR SELECT USING (is_active = true);


-- =====================================================================
-- БАНКНЫ ДАНС (Нийтэд идэвхтэй)
-- =====================================================================

CREATE POLICY "bank_accounts_select_active" ON bank_accounts
  FOR SELECT USING (is_active = true);


-- =====================================================================
-- БАННЕР (Нийтэд идэвхтэй + хугацаа шалгана)
-- =====================================================================

CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );


-- =====================================================================
-- КУПОН (Идэвхтэй + хугацаа шалгана)
-- =====================================================================

CREATE POLICY "coupons_select_active" ON coupons
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Coupon Products/Categories: Нэвтэрсэн хүн унших
CREATE POLICY "coupon_products_select" ON coupon_products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "coupon_categories_select" ON coupon_categories
  FOR SELECT TO authenticated USING (true);

-- Coupon Usages: Зөвхөн өөрийнх
CREATE POLICY "coupon_usages_select_own" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coupon_usages_insert_own" ON coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =====================================================================
-- ЗАР СУРТАЛЧИЛГАА (Нийтэд идэвхтэй)
-- =====================================================================

CREATE POLICY "ads_select_active" ON ads
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );


-- =====================================================================
-- БИДНИЙ ТУХАЙ (Нийтэд идэвхтэй)
-- =====================================================================

CREATE POLICY "about_sections_select_active" ON about_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "team_members_select_active" ON team_members
  FOR SELECT USING (is_active = true);


-- =====================================================================
-- ТОХИРГОО (Нийтэд зөвхөн public тохиргоо)
-- =====================================================================

CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (is_public = true);


-- =====================================================================
-- ADMIN-Д ЗОРИУЛСАН TABLE-УУД
-- Policy үүсгэхгүй = anon/authenticated хандах боломжгүй
-- service_role key (createAdminClient) RLS-г бүрэн тойрч гарна
-- =====================================================================

-- roles              → Policy байхгүй → Frontend хандахгүй
-- permissions        → Policy байхгүй → Frontend хандахгүй
-- role_permissions   → Policy байхгүй → Frontend хандахгүй
-- admins             → Policy байхгүй → Frontend хандахгүй
-- branches           → Policy байхгүй → Frontend хандахгүй
-- branch_inventory   → Policy байхгүй → Frontend хандахгүй
-- sms_campaigns      → Policy байхгүй → Frontend хандахгүй
-- sms_logs           → Policy байхгүй → Frontend хандахгүй
-- stock_history      → Policy байхгүй → Frontend хандахгүй
-- warehouses         → Policy байхгүй → Frontend хандахгүй


-- ============================================================================
-- БАТАЛГААЖУУЛАЛТ
-- ============================================================================

SELECT 'RLS бүрэн шинэчлэгдлээ!' as message;

-- ============================================================================
-- 00009_fix_table_permissions.sql
-- ============================================================================

-- ============================================================================
-- TABLE PERMISSION FIX
-- service_role key-д бүх table-д бүрэн хандах эрх олгоно
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant ALL on all tables to service_role (bypasses RLS anyway, but needs table permission)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant SELECT on catalog tables to anon (public read)
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON brands TO anon;
GRANT SELECT ON product_categories TO anon;
GRANT SELECT ON inventory TO anon;
GRANT SELECT ON product_attributes TO anon;
GRANT SELECT ON product_attribute_values TO anon;
GRANT SELECT ON product_attribute_configs TO anon;
GRANT SELECT ON product_variants TO anon;
GRANT SELECT ON product_variant_attributes TO anon;
GRANT SELECT ON product_images TO anon;
GRANT SELECT ON banners TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON coupons TO anon;
GRANT SELECT ON delivery_zones TO anon;
GRANT SELECT ON bank_accounts TO anon;
GRANT SELECT ON about_sections TO anon;
GRANT SELECT ON team_members TO anon;
GRANT SELECT ON settings TO anon;
GRANT SELECT ON articles TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON reviews TO anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ============================================================================
-- 00010_warehouses_rls.sql
-- ============================================================================

-- ============================================================================
-- WAREHOUSES RLS POLICY
-- warehouses table-д зөв RLS тохиргоо хийнэ
-- ============================================================================

-- 1. Хуучин policy устгах
DROP POLICY IF EXISTS "warehouses_select" ON warehouses;
DROP POLICY IF EXISTS "warehouses_insert" ON warehouses;
DROP POLICY IF EXISTS "warehouses_update" ON warehouses;
DROP POLICY IF EXISTS "warehouses_delete" ON warehouses;

-- 2. RLS идэвхжүүлэх
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- 3. Policy үүсгэхгүй
-- warehouses нь admin-only table тул anon/authenticated хандах шаардлагагүй
-- service_role key (createAdminClient) RLS-г бүрэн тойрч гарна

-- 4. service_role-д table permission олгох
GRANT ALL ON warehouses TO service_role;

SELECT 'Warehouses RLS тохируулагдлаа!' as message;

-- ============================================================================
-- 00011_product_variant_details.sql
-- ============================================================================

-- ============================================================================
-- PRODUCT VARIANT DETAILS TABLE + RLS
-- Variant-д дэлгэрэнгүй тайлбар хадгалах table
-- ============================================================================

-- 1. Table үүсгэх
CREATE TABLE IF NOT EXISTS product_variant_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_variant_details_variant_id
  ON product_variant_details(variant_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_variant_details ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
CREATE POLICY "product_variant_details_select" ON product_variant_details
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_variant_details TO service_role;

SELECT 'product_variant_details table + RLS тохируулагдлаа!' as message;

-- ============================================================================
-- 00012_addresses_contact_fields.sql
-- ============================================================================

-- ============================================================================
-- ADDRESSES TABLE - sub_district нэмэх
-- USERS TABLE - full_name, phone устгаж, first_name, last_name, primary_phone, secondary_phone нэмэх
-- ============================================================================

-- 1. addresses: sub_district нэмэх
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS sub_district VARCHAR;

-- 2. addresses: хуучин холбоо барих талбарууд устгах (хэрэв байвал)
ALTER TABLE addresses DROP COLUMN IF EXISTS last_name;
ALTER TABLE addresses DROP COLUMN IF EXISTS first_name;
ALTER TABLE addresses DROP COLUMN IF EXISTS phone;
ALTER TABLE addresses DROP COLUMN IF EXISTS phone_2;

-- 3. users: шинэ талбарууд нэмэх
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50);

-- 4. users: full_name, phone утгыг шилжүүлэх (өгөгдөл алдахгүй)
UPDATE users SET first_name = full_name WHERE first_name IS NULL AND full_name IS NOT NULL;
UPDATE users SET primary_phone = phone WHERE primary_phone IS NULL AND phone IS NOT NULL;

-- 5. users: хуучин талбарууд устгах
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

SELECT 'addresses + users table шинэчлэгдлээ!' as message;

-- ============================================================================
-- 00013_users_email_nullable.sql
-- ============================================================================

-- ============================================================================
-- USERS TABLE - email nullable болгох (утасны дугаараар бүртгэх боломжтой)
-- ============================================================================

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- ============================================================================
-- 00014_performance_rpcs.sql
-- ============================================================================

-- Performance RPC functions for admin panel
-- Replaces N+1 HTTP requests with single atomic database calls

-- =============================================================================
-- save_product: Atomic product save (upsert product + variants + images + categories)
-- =============================================================================
CREATE OR REPLACE FUNCTION save_product(
  p_category_ids UUID[],
  p_images JSONB,
  p_product JSONB,
  p_variants JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Upsert variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Replace variant details
    DELETE FROM product_variant_details WHERE variant_id = v_variant_id;
    v_sort := 0;
    IF v_variant->'details' IS NOT NULL AND jsonb_array_length(v_variant->'details') > 0 THEN
      FOR v_detail IN SELECT * FROM jsonb_array_elements(v_variant->'details')
      LOOP
        IF COALESCE(v_detail->>'type', '') != '' AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
          INSERT INTO product_variant_details (variant_id, type, content, sort_order)
          VALUES (v_variant_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
          v_sort := v_sort + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Find the real variant_id from our array
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- For newly created variants, find by matching position
      -- The variant was already inserted above so look it up by sku+name+product_id
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- =============================================================================
-- get_variant_details_batch: Fetch variant details for multiple variants at once
-- =============================================================================
CREATE OR REPLACE FUNCTION get_variant_details_batch(p_variant_ids UUID[])
RETURNS TABLE (
  id UUID,
  variant_id UUID,
  type TEXT,
  content TEXT,
  sort_order INT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pvd.id,
    pvd.variant_id,
    pvd.type,
    pvd.content,
    pvd.sort_order
  FROM product_variant_details pvd
  WHERE pvd.variant_id = ANY(p_variant_ids)
  ORDER BY pvd.variant_id, pvd.sort_order;
END;
$$;

-- Grant execute permissions to service_role
GRANT EXECUTE ON FUNCTION save_product(UUID[], JSONB, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_variant_details_batch(UUID[]) TO service_role;

-- ============================================================================
-- 00015_search_rpcs.sql
-- ============================================================================

-- Search Migration: Run this in Supabase SQL Editor
-- Requires pg_trgm extension (enabled by default on Supabase)

-- 1. Trigram index on product description
CREATE INDEX IF NOT EXISTS idx_products_description_trgm
  ON products USING GIN(description gin_trgm_ops);

-- 2. Lower similarity threshold for Cyrillic text
SELECT set_limit(0.15);

-- 3. search_suggestions RPC
CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      p.images[1]::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        p.name % p_search_query
        OR p.description % p_search_query
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND c.name % p_search_query
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

-- 4. search_products RPC
CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  compare_at_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.compare_at_price,
      p.images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (
        p.name % p_search_query
        OR p.description % p_search_query
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.compare_at_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- ============================================================================
-- 00016_categories_missing_columns.sql
-- ============================================================================

-- Add missing columns to categories table
-- The frontend expects these columns but they were never added to the schema

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Generate unique slugs for existing categories
-- Appends row_number to duplicates to avoid conflicts
UPDATE categories SET slug = sub.unique_slug
FROM (
  SELECT id,
    CASE
      WHEN cnt > 1 THEN base_slug || '-' || rn::text
      ELSE base_slug
    END AS unique_slug
  FROM (
    SELECT id,
      LOWER(REPLACE(name, ' ', '-')) AS base_slug,
      ROW_NUMBER() OVER (PARTITION BY LOWER(REPLACE(name, ' ', '-')) ORDER BY id) AS rn,
      COUNT(*) OVER (PARTITION BY LOWER(REPLACE(name, ' ', '-'))) AS cnt
    FROM categories
  ) numbered
) sub
WHERE categories.id = sub.id AND categories.slug IS NULL;

-- Now add the unique constraint (skip if already exists)
DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ============================================================================
-- Add missing columns to products table
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sku VARCHAR,
  ADD COLUMN IF NOT EXISTS barcode VARCHAR,
  ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Migrate existing discount_price to compare_at_price
UPDATE products SET compare_at_price = discount_price WHERE discount_price IS NOT NULL AND compare_at_price IS NULL;

-- Migrate existing status enum to is_active boolean
UPDATE products SET is_active = (status = 'active') WHERE is_active IS NULL;

-- Migrate stock from inventory table
UPDATE products SET stock_quantity = inventory.stock_quantity
FROM inventory
WHERE products.id = inventory.product_id AND products.stock_quantity = 0;

-- Migrate category_id from product_categories junction table (use first category)
UPDATE products SET category_id = pc.category_id
FROM (
  SELECT DISTINCT ON (product_id) product_id, category_id
  FROM product_categories
  ORDER BY product_id
) pc
WHERE products.id = pc.product_id AND products.category_id IS NULL;

-- Migrate images from product_images table (aggregate into array)
UPDATE products SET images = sub.image_urls
FROM (
  SELECT product_id, ARRAY_AGG(url ORDER BY sort_order, id) AS image_urls
  FROM product_images
  GROUP BY product_id
) sub
WHERE products.id = sub.product_id AND (products.images = '{}' OR products.images IS NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- ============================================================================
-- 00017_auth_user_trigger.sql
-- ============================================================================

-- ============================================================================
-- AUTH USER -> PUBLIC USER auto-sync trigger
-- Phone OTP-р бүртгэгдсэн auth user-г public.users-д автоматаар үүсгэх
-- ============================================================================

-- 1. Trigger function: auth.users-д шинэ хэрэглэгч бүртгэгдэхэд public.users-д мөр үүсгэнэ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, primary_phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger үүсгэх
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Одоо байгаа auth users-г public.users-д нэмэх (байхгүй бол)
INSERT INTO public.users (id, email, primary_phone)
SELECT au.id, au.email, au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT DO NOTHING;

SELECT 'Auth user trigger амжилттай үүслээ!' as message;

-- ============================================================================
-- 00018_brands_slug.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: brands table-д slug, banner_image нэмэх
-- ============================================================================

-- slug column нэмэх
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;

-- banner_image column нэмэх
ALTER TABLE brands ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- type column нэмэх (beauty, salon гэх мэт)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS type VARCHAR;

-- Одоо байгаа brand-уудын slug-ийг name-ээс автоматаар үүсгэх
UPDATE brands
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM(name),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s]+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- slug index нэмэх
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- category_id column устгах (хэрэггүй)
ALTER TABLE brands DROP COLUMN IF EXISTS category_id;

-- type index нэмэх
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands(type);

-- ============================================================================
-- 00019_categories_is_featured.sql
-- ============================================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_is_featured ON categories(is_featured);

-- ============================================================================
-- 00020_variant_description.sql
-- ============================================================================

-- Add description column to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN product_variants.description IS 'Variant specific description';

-- ============================================================================
-- 00021_fix_product_images_sync.sql
-- ============================================================================

-- Fix save_product to also update products.images column for frontend compatibility
-- The frontend expects images as a text[] column on products table

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_image_urls TEXT[] := '{}';
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Upsert variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Replace variant details
    DELETE FROM product_variant_details WHERE variant_id = v_variant_id;
    v_sort := 0;
    IF v_variant->'details' IS NOT NULL AND jsonb_array_length(v_variant->'details') > 0 THEN
      FOR v_detail IN SELECT * FROM jsonb_array_elements(v_variant->'details')
      LOOP
        IF COALESCE(v_detail->>'type', '') != '' AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
          INSERT INTO product_variant_details (variant_id, type, content, sort_order)
          VALUES (v_variant_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
          v_sort := v_sort + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products.images column for frontend compatibility
  UPDATE products SET images = v_image_urls WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Find the real variant_id from our array
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- For newly created variants, find by matching position
      -- The variant was already inserted above so look it up by sku+name+product_id
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Backfill existing products: sync product_images to products.images column
UPDATE products p
SET images = COALESCE(
  (
    SELECT array_agg(pi.url ORDER BY pi.sort_order)
    FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.variant_id IS NULL
  ),
  '{}'
);

-- ============================================================================
-- 00021_orders_delivery_status.sql
-- ============================================================================

-- Create delivery_status enum type
CREATE TYPE delivery_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'canceled');

-- Add delivery_status column to orders table using the new enum
ALTER TABLE orders
ADD COLUMN delivery_status delivery_status DEFAULT 'pending';

-- Migrate existing delivery-related statuses to the new delivery_status column
UPDATE orders SET delivery_status = 'shipped' WHERE status = 'shipped';
UPDATE orders SET delivery_status = 'delivered' WHERE status = 'delivered';

-- Now we need to change order_status enum to remove shipped and delivered
-- PostgreSQL doesn't allow removing enum values directly, so we need to:
-- 1. Create a new enum without shipped/delivered
-- 2. Update the column to use the new enum
-- 3. Drop the old enum

-- Create new order_status enum without delivery-related values
CREATE TYPE order_status_new AS ENUM ('pending', 'confirmed', 'canceled');

-- Update orders with shipped/delivered status to a valid new status
UPDATE orders SET status = 'confirmed' WHERE status IN ('shipped', 'delivered');

-- Drop the default constraint first (required before type change)
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

-- Change column to use new enum
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_new
  USING status::text::order_status_new;

-- Re-add the default
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Drop old enum and rename new one
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;

-- ============================================================================
-- 00022_order_status_history.sql
-- ============================================================================

-- Create order status history table to track all status changes
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status_type TEXT NOT NULL CHECK (status_type IN ('order', 'delivery', 'payment')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by order
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(order_id, changed_at DESC);

-- Trigger function to auto-record status changes
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Track delivery_status changes
  IF OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'delivery', OLD.delivery_status::TEXT, NEW.delivery_status::TEXT);
  END IF;

  -- Track order status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'order', OLD.status::TEXT, NEW.status::TEXT);
  END IF;

  -- Track payment_status changes
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_status_history (order_id, status_type, previous_status, new_status)
    VALUES (NEW.id, 'payment', OLD.payment_status::TEXT, NEW.payment_status::TEXT);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_order_status_change();

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policy for service role (admin API)
CREATE POLICY "Service role can do anything" ON order_status_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to read their own order history
CREATE POLICY "Users can view their own order history" ON order_status_history
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 00022_product_details.sql
-- ============================================================================

-- ============================================================================
-- PRODUCT DETAILS TABLE (product_id-аар холбогдсон)
-- product_variant_details-ийг product_details болгон шилжүүлэх
-- ============================================================================

-- 1. Шинэ table үүсгэх
CREATE TABLE IF NOT EXISTS product_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_details_product_id
  ON product_details(product_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_details ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
DROP POLICY IF EXISTS "product_details_select" ON product_details;
CREATE POLICY "product_details_select" ON product_details
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_details TO service_role;

-- 6. Хуучин өгөгдлийг шилжүүлэх (product_variant_details -> product_details)
INSERT INTO product_details (product_id, type, content, sort_order, created_at)
SELECT DISTINCT ON (pv.product_id, pvd.type)
  pv.product_id,
  pvd.type,
  pvd.content,
  pvd.sort_order,
  pvd.created_at
FROM product_variant_details pvd
JOIN product_variants pv ON pv.id = pvd.variant_id
WHERE pv.is_default = true
ON CONFLICT DO NOTHING;

-- 7. Хуучин table устгах
DROP TABLE IF EXISTS product_variant_details;

SELECT 'product_details table үүсгэгдэж, product_variant_details устгагдлаа!' as message;

-- ============================================================================
-- 00023_update_save_product_details.sql
-- ============================================================================

-- Update save_product to use product_details instead of product_variant_details
-- Now details are stored at product level, not variant level

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_image_urls TEXT[] := '{}';
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (at product level)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      IF COALESCE(v_detail->>'type', '') != '' AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Upsert variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products.images column for frontend compatibility
  UPDATE products SET images = v_image_urls WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'save_product updated to use product_details!' as message;

-- ============================================================================
-- 00024_drop_old_save_product.sql
-- ============================================================================

-- Drop the old 4-parameter version of save_product
-- This resolves the ambiguous function call error
DROP FUNCTION IF EXISTS public.save_product(jsonb, jsonb, jsonb, uuid[]);

SELECT 'Dropped old save_product function' as message;

-- ============================================================================
-- 00025_grant_product_details_anon.sql
-- ============================================================================

-- Grant SELECT permission to anon role for product_details table
-- RLS policy exists but anon role needs table-level SELECT permission

GRANT SELECT ON product_details TO anon;
GRANT SELECT ON product_details TO authenticated;

SELECT 'Granted SELECT on product_details to anon and authenticated roles' as message;

-- ============================================================================
-- 00026_product_rich_descriptions.sql
-- ============================================================================

-- ============================================================================
-- PRODUCT RICH DESCRIPTIONS TABLE
-- Дэлгэрэнгүй тайлбар (текст + зураг) хадгалах тусдаа хүснэгт
-- ============================================================================

-- 1. Шинэ table үүсгэх
CREATE TABLE IF NOT EXISTS product_rich_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content TEXT,  -- Rich text content
  images TEXT[] DEFAULT '{}',  -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)  -- Нэг product-д нэг л rich description
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_product_rich_descriptions_product_id
  ON product_rich_descriptions(product_id);

-- 3. RLS идэвхжүүлэх
ALTER TABLE product_rich_descriptions ENABLE ROW LEVEL SECURITY;

-- 4. Нийтэд нээлттэй унших (каталог мэдээлэл)
DROP POLICY IF EXISTS "product_rich_descriptions_select" ON product_rich_descriptions;
CREATE POLICY "product_rich_descriptions_select" ON product_rich_descriptions
  FOR SELECT USING (true);

-- 5. service_role-д бүрэн эрх (admin panel)
GRANT ALL ON product_rich_descriptions TO service_role;

-- 6. anon role-д унших эрх
GRANT SELECT ON product_rich_descriptions TO anon;

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_product_rich_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_rich_descriptions_updated_at ON product_rich_descriptions;
CREATE TRIGGER trigger_product_rich_descriptions_updated_at
  BEFORE UPDATE ON product_rich_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rich_descriptions_updated_at();

-- 8. Хуучин product_details-ээс шилжүүлэх (хэрэв байвал)
INSERT INTO product_rich_descriptions (product_id, content, images)
SELECT
  pd.product_id,
  MAX(CASE WHEN pd.type = 'rich_description' THEN pd.content END) as content,
  ARRAY_AGG(pd.content) FILTER (WHERE pd.type = 'rich_image') as images
FROM product_details pd
WHERE pd.type IN ('rich_description', 'rich_image')
GROUP BY pd.product_id
ON CONFLICT (product_id) DO NOTHING;

-- 9. Хуучин rich_description, rich_image entries устгах
DELETE FROM product_details WHERE type IN ('rich_description', 'rich_image');

SELECT 'product_rich_descriptions table үүсгэгдлээ!' as message;

-- ============================================================================
-- 00027_update_save_product_rich.sql
-- ============================================================================

-- ============================================================================
-- UPDATE save_product TO USE product_rich_descriptions TABLE
-- ============================================================================

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL  -- { content: string, images: string[] }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_image_urls TEXT[] := '{}';
  v_rich_images TEXT[];
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    -- Convert JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
    ) INTO v_rich_images;

    INSERT INTO product_rich_descriptions (product_id, content, images)
    VALUES (
      v_product_id,
      NULLIF(TRIM(p_rich_description->>'content'), ''),
      COALESCE(v_rich_images, '{}')
    )
    ON CONFLICT (product_id) DO UPDATE SET
      content = NULLIF(TRIM(p_rich_description->>'content'), ''),
      images = COALESCE(v_rich_images, '{}'),
      updated_at = NOW();
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products.images column for frontend compatibility
  UPDATE products SET images = v_image_urls WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'save_product updated to use product_rich_descriptions!' as message;

-- ============================================================================
-- 00028_fix_search_similarity_threshold.sql
-- ============================================================================

-- Fix search functions: use ILIKE for reliable substring matching + trigram for ranking
-- The trigram % operator and similarity threshold were unreliable for mixed Latin/Cyrillic text

CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      p.images[1]::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND c.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  compare_at_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.compare_at_price,
      p.images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.compare_at_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- ============================================================================
-- 00029_order_status_history_is_read.sql
-- ============================================================================

-- Add is_read column to order_status_history for tracking notification read status
ALTER TABLE order_status_history ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Index for fast unread count queries
CREATE INDEX idx_order_status_history_is_read ON order_status_history(order_id, is_read) WHERE is_read = FALSE;

-- Policy for authenticated users to update is_read on their own order history
CREATE POLICY "Users can mark their own status history as read" ON order_status_history
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 00029_sync_product_category_id.sql
-- ============================================================================

-- ============================================================================
-- SYNC products.category_id WHEN SAVING PRODUCTS
-- ============================================================================
-- Problem: save_product RPC updates product_categories junction table but not
-- products.category_id. Client web queries products.category_id directly.
-- Solution: Add category_id sync after updating product_categories.

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL  -- { content: string, images: string[] }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_image_urls TEXT[] := '{}';
  v_rich_images TEXT[];
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    -- Convert JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
    ) INTO v_rich_images;

    INSERT INTO product_rich_descriptions (product_id, content, images)
    VALUES (
      v_product_id,
      NULLIF(TRIM(p_rich_description->>'content'), ''),
      COALESCE(v_rich_images, '{}')
    )
    ON CONFLICT (product_id) DO UPDATE SET
      content = NULLIF(TRIM(p_rich_description->>'content'), ''),
      images = COALESCE(v_rich_images, '{}'),
      updated_at = NOW();
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products.images column for frontend compatibility
  UPDATE products SET images = v_image_urls WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Sync category_id to products table (use first category for client compatibility)
  IF p_category_ids IS NOT NULL AND array_length(p_category_ids, 1) > 0 THEN
    UPDATE products SET category_id = p_category_ids[1] WHERE id = v_product_id;
  ELSE
    UPDATE products SET category_id = NULL WHERE id = v_product_id;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Also sync any existing products that have product_categories but missing category_id
UPDATE products SET category_id = pc.category_id
FROM (
  SELECT DISTINCT ON (product_id) product_id, category_id
  FROM product_categories
  ORDER BY product_id
) pc
WHERE products.id = pc.product_id AND products.category_id IS NULL;

SELECT 'save_product updated to sync products.category_id!' as message;

-- ============================================================================
-- 00029_sync_product_sku_stock.sql
-- ============================================================================

-- ============================================================================
-- UPDATE save_product TO SYNC sku AND stock_quantity TO products TABLE
-- The products table has sku and stock_quantity columns that need to be synced
-- from the first/default variant for frontend compatibility
-- ============================================================================

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_image_urls TEXT[] := '{}';
  v_rich_images TEXT[];
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    -- Convert JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
    ) INTO v_rich_images;

    INSERT INTO product_rich_descriptions (product_id, content, images)
    VALUES (
      v_product_id,
      NULLIF(TRIM(p_rich_description->>'content'), ''),
      COALESCE(v_rich_images, '{}')
    )
    ON CONFLICT (product_id) DO UPDATE SET
      content = NULLIF(TRIM(p_rich_description->>'content'), ''),
      images = COALESCE(v_rich_images, '{}'),
      updated_at = NOW();
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images) and collect URLs
  v_sort := 0;
  v_image_urls := '{}';
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_image_urls := v_image_urls || (v_image->>'url');
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: images, sku, stock_quantity
  UPDATE products SET
    images = v_image_urls,
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Backfill: sync existing products' sku and stock_quantity from their variants
UPDATE products p
SET
  sku = COALESCE(p.sku, dv.sku),
  stock_quantity = COALESCE(ts.total_stock, 0)
FROM (
  SELECT product_id, sku
  FROM product_variants
  WHERE is_default = true OR id IN (
    SELECT id FROM product_variants pv2
    WHERE pv2.product_id = product_variants.product_id
    ORDER BY created_at LIMIT 1
  )
) dv,
(
  SELECT product_id, SUM(stock_quantity) as total_stock
  FROM product_variants
  GROUP BY product_id
) ts
WHERE p.id = dv.product_id AND p.id = ts.product_id;

SELECT 'save_product updated to sync sku and stock_quantity to products table!' as message;

-- ============================================================================
-- 00030_remove_redundant_product_columns.sql
-- ============================================================================

-- ============================================================================
-- REMOVE REDUNDANT COLUMNS FROM PRODUCTS TABLE
-- - images: Already stored in product_images table
-- - category_id: Already stored in product_categories junction table
-- ============================================================================

-- First, update save_product function to remove images sync
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Update search_suggestions to get image from product_images table
CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL ORDER BY pi.sort_order LIMIT 1)::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND c.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

-- Update search_products to get category from product_categories junction
CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.discount_price,
      COALESCE(
        (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
        '{}'::text[]
      ) AS images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.discount_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM (
    SELECT DISTINCT ON (matched.id)
      matched.*
    FROM matched
  ) m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- Drop redundant columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS images;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

SELECT 'Removed redundant images and category_id columns from products table' as message;

-- ============================================================================
-- 00031_banner_button_text.sql
-- ============================================================================

-- Add button_text column and remove unused columns from banners table
-- Keep category_id and product_id for optional relations

-- Drop policy that depends on columns we're removing
DROP POLICY IF EXISTS "banners_select_active" ON banners;

-- Add new column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_text VARCHAR(100);

-- Remove only truly unused columns (keep category_id, product_id, sort_order)
ALTER TABLE banners DROP COLUMN IF EXISTS mobile_image_url;
ALTER TABLE banners DROP COLUMN IF EXISTS link_type;
ALTER TABLE banners DROP COLUMN IF EXISTS start_date;
ALTER TABLE banners DROP COLUMN IF EXISTS end_date;

-- Recreate policy without date checks
CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (is_active = true);
 

-- ============================================================================
-- 00032_simplify_banner_schema.sql
-- ============================================================================

-- Simplify banner schema to match frontend static banner component
-- Add variant field and remove analytics fields
-- Keep category_id and product_id as optional relations

-- 1. Update any existing banners with null descriptions to empty string
UPDATE banners SET description = '' WHERE description IS NULL;

-- 2. Make description required (not nullable)
ALTER TABLE banners
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '';

-- 3. Add variant field (rose | blue)
ALTER TABLE banners
  ADD COLUMN variant VARCHAR(10) NOT NULL DEFAULT 'rose'
  CHECK (variant IN ('rose', 'blue'));

-- 4. Remove unused fields (keep category_id and product_id)
ALTER TABLE banners
  DROP COLUMN IF EXISTS link_url,
  DROP COLUMN IF EXISTS button_text,
  DROP COLUMN IF EXISTS click_count,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS position;

-- ============================================================================
-- 00033_banner_link_url.sql
-- ============================================================================

-- Add link_url column for custom banner links
ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN banners.link_url IS 'Custom URL for banner link (alternative to category_id/product_id)';

-- ============================================================================
-- 00034_search_logs.sql
-- ============================================================================

-- Search logs table to track user searches for trending feature
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,              -- Normalized (lowercase, trimmed)
  raw_query TEXT NOT NULL,          -- Original as typed
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,                  -- For anonymous tracking
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query_created ON search_logs(query, created_at DESC);

-- RLS policies
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log searches" ON search_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RPC: Get trending searches with exponential decay
-- weight = e^(-0.693 * age_in_days) -> today=1.0, yesterday=0.5, 2 days ago=0.25
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INT DEFAULT 5,
  p_days INT DEFAULT 7,
  p_min_count INT DEFAULT 2
)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  weighted_score NUMERIC,
  last_searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH search_stats AS (
    SELECT
      sl.query,
      COUNT(*) AS raw_count,
      MAX(sl.created_at) AS last_searched,
      SUM(EXP(-0.693 * EXTRACT(EPOCH FROM (NOW() - sl.created_at)) / 86400)) AS weighted_score
    FROM search_logs sl
    WHERE sl.created_at > NOW() - (p_days || ' days')::INTERVAL
      AND sl.result_count > 0
      AND LENGTH(sl.query) >= 2
    GROUP BY sl.query
    HAVING COUNT(*) >= p_min_count
  )
  SELECT
    ss.query,
    ss.raw_count AS search_count,
    ROUND(ss.weighted_score::NUMERIC, 2) AS weighted_score,
    ss.last_searched AS last_searched_at
  FROM search_stats ss
  ORDER BY ss.weighted_score DESC, ss.raw_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trending_searches TO anon, authenticated;

-- ============================================================================
-- 00035_fix_trending_searches.sql
-- ============================================================================

-- Fix trending searches RPC to include all searches (not just those with results)
-- and lower the default min_count
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INT DEFAULT 5,
  p_days INT DEFAULT 7,
  p_min_count INT DEFAULT 1
)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  weighted_score NUMERIC,
  last_searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH search_stats AS (
    SELECT
      sl.query,
      COUNT(*) AS raw_count,
      MAX(sl.created_at) AS last_searched,
      SUM(EXP(-0.693 * EXTRACT(EPOCH FROM (NOW() - sl.created_at)) / 86400)) AS weighted_score
    FROM search_logs sl
    WHERE sl.created_at > NOW() - (p_days || ' days')::INTERVAL
      AND LENGTH(sl.query) >= 2
    GROUP BY sl.query
    HAVING COUNT(*) >= p_min_count
  )
  SELECT
    ss.query,
    ss.raw_count AS search_count,
    ROUND(ss.weighted_score::NUMERIC, 2) AS weighted_score,
    ss.last_searched AS last_searched_at
  FROM search_stats ss
  ORDER BY ss.weighted_score DESC, ss.raw_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 00036_search_suggestions_brands.sql
-- ============================================================================

-- Update search_suggestions to include brands
-- Merged from 00028_fix_search_similarity_threshold.sql with brands support

CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      p.images[1]::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND c.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  UNION ALL
  (
    SELECT
      'brand'::text AS type,
      b.name::text AS text,
      b.slug::text,
      b.logo_url::text AS image,
      similarity(b.name, p_search_query)::real AS similarity
    FROM brands b
    WHERE b.name ILIKE v_pattern
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

-- ============================================================================
-- 00037_fix_save_product_original_url.sql
-- ============================================================================

-- ============================================================================
-- FIX: Add original_url to save_product function
-- The original_url field was not being saved in INSERT or UPDATE statements
-- ============================================================================

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id, original_url)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', '')
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'Added original_url to save_product function INSERT and UPDATE statements' as message;

-- ============================================================================
-- 00037_fix_trending_searches_security.sql
-- ============================================================================

-- Fix trending searches RPC to use SECURITY DEFINER
-- This allows the function to read search_logs even though RLS only allows INSERT
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INT DEFAULT 5,
  p_days INT DEFAULT 7,
  p_min_count INT DEFAULT 1
)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  weighted_score NUMERIC,
  last_searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH search_stats AS (
    SELECT
      sl.query,
      COUNT(*) AS raw_count,
      MAX(sl.created_at) AS last_searched,
      SUM(EXP(-0.693 * EXTRACT(EPOCH FROM (NOW() - sl.created_at)) / 86400)) AS weighted_score
    FROM search_logs sl
    WHERE sl.created_at > NOW() - (p_days || ' days')::INTERVAL
      AND LENGTH(sl.query) >= 2
    GROUP BY sl.query
    HAVING COUNT(*) >= p_min_count
  )
  SELECT
    ss.query,
    ss.raw_count AS search_count,
    ROUND(ss.weighted_score::NUMERIC, 2) AS weighted_score,
    ss.last_searched AS last_searched_at
  FROM search_stats ss
  ORDER BY ss.weighted_score DESC, ss.raw_count DESC
  LIMIT p_limit;
END;
$$;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION get_trending_searches TO anon, authenticated;

-- ============================================================================
-- 00038_best_selling_products.sql
-- ============================================================================

-- Best Selling Products RPC
-- Returns products sorted by total quantity sold within a given period

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_best_selling_products(int, int);

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_period_days int DEFAULT 7,
  p_limit int DEFAULT 40
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  discount_price numeric,
  sku text,
  barcode text,
  stock_quantity int,
  is_active boolean,
  is_featured boolean,
  brand_id uuid,
  metadata jsonb,
  created_at timestamp,
  updated_at timestamp,
  images text[],
  category_id uuid,
  total_sold bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  start_date timestamp := now() - (p_period_days || ' days')::interval;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT
      oi.product_id,
      SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= start_date
      AND o.status != 'canceled'
    GROUP BY oi.product_id
  )
  SELECT
    p.id,
    p.name::text,
    p.slug::text,
    p.description::text,
    p.price,
    p.discount_price,
    p.sku::text,
    p.barcode::text,
    p.stock_quantity,
    p.is_active,
    p.is_featured,
    p.brand_id,
    p.metadata,
    p.created_at,
    p.updated_at,
    -- Get images from product_images table
    COALESCE(
      (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order)
       FROM product_images pi
       WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
      '{}'::text[]
    ) AS images,
    -- Get category_id from product_categories junction table
    (SELECT pc.category_id FROM product_categories pc WHERE pc.product_id = p.id LIMIT 1) AS category_id,
    COALESCE(s.total_sold, 0::bigint) AS total_sold
  FROM products p
  LEFT JOIN sales s ON s.product_id = p.id
  WHERE p.is_active = true
  ORDER BY COALESCE(s.total_sold, 0::bigint) DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to anonymous users
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO anon;
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO authenticated;

-- ============================================================================
-- 00039_admin_notifications.sql
-- ============================================================================

-- ============================================================================
-- Admin Notifications with Real-time Order Alerts
-- ============================================================================

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'order',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read
CREATE POLICY "Admins can read admin_notifications" ON admin_notifications
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (admins) to update (mark as read)
CREATE POLICY "Admins can update admin_notifications" ON admin_notifications
    FOR UPDATE TO authenticated USING (true);

-- Trigger function to create admin notification on new order
CREATE OR REPLACE FUNCTION create_admin_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_phone TEXT;
BEGIN
    -- Get user info
    SELECT
        COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email),
        COALESCE(primary_phone, '')
    INTO v_user_name, v_user_phone
    FROM users
    WHERE id = NEW.user_id;

    -- Create admin notification
    INSERT INTO admin_notifications (type, title, body, metadata)
    VALUES (
        'order',
        'Шинэ захиалга ирлээ',
        format('Захиалга #%s - %s (%s₮)',
            COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)),
            COALESCE(v_user_name, 'Хэрэглэгч'),
            NEW.total_amount::text
        ),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'user_id', NEW.user_id,
            'user_name', v_user_name,
            'user_phone', v_user_phone,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'payment_status', NEW.payment_status
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_admin_order_notification ON orders;
CREATE TRIGGER trigger_admin_order_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_order_notification();

-- Enable Realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Grant permissions
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_notifications TO service_role;

-- ============================================================================
-- 00039_remove_unused_variant_columns.sql
-- ============================================================================

-- ============================================================================
-- Remove unused columns from product_variants table
-- These columns are not used in the current UI and add unnecessary complexity
-- ============================================================================

-- Remove unused columns from product_variants
ALTER TABLE product_variants
  DROP COLUMN IF EXISTS cost_price,
  DROP COLUMN IF EXISTS low_stock_threshold,
  DROP COLUMN IF EXISTS weight,
  DROP COLUMN IF EXISTS barcode,
  DROP COLUMN IF EXISTS description;

-- Update save_product function to remove description handling
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
BEGIN
  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id, original_url)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', '')
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant (removed description from INSERT)
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- Match by sku and name
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'Removed unused columns (cost_price, low_stock_threshold, weight, barcode, description) from product_variants' as message;

-- ============================================================================
-- 00040_enable_notifications_realtime.sql
-- ============================================================================

-- ============================================================================
-- Enable Realtime for Frontend Notifications
-- ============================================================================

-- Enable Realtime for notifications table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Enable Realtime for order_status_history table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_status_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
    END IF;
END $$;

-- ============================================================================
-- 00041_fix_auth_user_trigger_oauth.sql
-- ============================================================================

-- ============================================================================
-- AUTH USER -> PUBLIC USER auto-sync trigger (OAuth дэмжсэн)
-- Facebook, Google OAuth-аар бүртгэгдсэн хэрэглэгчдийг зөв үүсгэх
-- ============================================================================

-- 1. Сайжруулсан trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
BEGIN
  -- Email авах
  v_email := NEW.email;

  -- OAuth metadata-аас мэдээлэл авах (Facebook, Google)
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2), '')
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- public.users-д оруулах
  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    NEW.id,
    v_email,
    NULLIF(v_first_name, ''),
    NULLIF(v_last_name, ''),
    v_avatar_url,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email давхцсан бол update хийх
    UPDATE public.users SET
      first_name = COALESCE(NULLIF(v_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(v_last_name, ''), last_name),
      avatar_url = COALESCE(v_avatar_url, avatar_url)
    WHERE email = v_email;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Алдааг log хийж, trigger fail хийхгүй
    RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger дахин үүсгэх
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Одоо байгаа OAuth хэрэглэгчдийг sync хийх (өмнө нь бүртгэгдсэн боловч public.users-д байхгүй бол)
INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 2), '')
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT 'OAuth-supported auth user trigger амжилттай үүслээ!' as message;

-- ============================================================================
-- 00042_add_lendmn_support.sql
-- ============================================================================

-- Add provider and external_invoice_number columns for LendMN integration
ALTER TABLE payment_invoices
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'qpay';

ALTER TABLE payment_invoices
  ADD COLUMN IF NOT EXISTS external_invoice_number text;

CREATE INDEX IF NOT EXISTS idx_payment_invoices_external_invoice_number
  ON payment_invoices(external_invoice_number) WHERE external_invoice_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_invoices_provider
  ON payment_invoices(provider);

-- ============================================================================
-- 00042_fix_search_products_discount_price.sql
-- ============================================================================

-- Fix search_products to return discount_price instead of compare_at_price
-- The function was returning compare_at_price which doesn't exist in the products table

-- Drop existing function first (return type changed from compare_at_price to discount_price)
DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_pattern text := '%' || p_search_query || '%';
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.discount_price,
      COALESCE(
        (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
        '{}'::text[]
      ) AS images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      AND (
        p.name ILIKE v_pattern
        OR p.description ILIKE v_pattern
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.discount_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM (
    SELECT DISTINCT ON (matched.id)
      matched.*
    FROM matched
  ) m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- ============================================================================
-- 00043_enable_cron_and_schedule_invoice_check.sql
-- ============================================================================

-- Enable pg_cron and pg_net extensions for server-side invoice checking
-- The check-pending-invoices edge function is invoked manually, not on a cron schedule.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================================
-- 00044_schedule_pending_invoice_check.sql
-- ============================================================================

-- Schedule pg_cron job to check pending payment invoices every 5 minutes.
-- This is the critical safety net for QPay payments (no webhook/callback),
-- catching payments where the user closed the browser before polling detected it.
--
-- Prerequisites (from migration 00043):
--   - pg_cron extension enabled
--   - pg_net extension enabled
--
-- The check-pending-invoices edge function (already deployed) handles:
--   - Fetching pending invoices (5 min – 2 hrs old)
--   - Verifying QPay and LendMN payment status
--   - Updating DB + creating orders for paid invoices
--   - Expiring invoices older than 2 hours

-- Store project URL in Vault for use by pg_cron (avoids hardcoding)
SELECT vault.create_secret(
  'https://qtpfavodqjyosdnxjwjq.supabase.co',
  'project_url'
);

-- Schedule: every 5 minutes, invoke the check-pending-invoices edge function
-- The function has verify_jwt=false, so no Authorization header is needed.
SELECT cron.schedule(
  'check-pending-invoices',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/check-pending-invoices',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- ============================================================================
-- 00045_option_groups_in_metadata.sql
-- ============================================================================

-- ============================================================================
-- Save option_groups in products.metadata
-- This allows restoring option groups when editing a product
-- ============================================================================

-- Update save_product function to accept and save option_groups
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL,
  p_option_groups JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_metadata JSONB;
BEGIN
  -- Build metadata with option_groups
  v_metadata := COALESCE(p_option_groups, '[]'::jsonb);
  IF jsonb_array_length(v_metadata) > 0 THEN
    v_metadata := jsonb_build_object('option_groups', v_metadata);
  ELSE
    v_metadata := NULL;
  END IF;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id, original_url, metadata)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', ''),
      v_metadata
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Reset all existing is_default to false before setting new one
  UPDATE product_variants SET is_default = false WHERE product_id = v_product_id;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- Match by sku and name
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'Added p_option_groups parameter to save_product - stores in products.metadata' as message;

-- ============================================================================
-- 00046_variant_option_values.sql
-- ============================================================================

-- ============================================================================
-- Add option_values column to product_variants
-- This stores the individual option values for each variant (e.g., ["17C", "50ml"])
-- Frontend uses this to match selected options to the correct variant
-- ============================================================================

-- Add option_values column
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS option_values TEXT[] DEFAULT '{}';

-- Update save_product function to accept and save option_values
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL,
  p_option_groups JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_metadata JSONB;
  v_option_values TEXT[];
BEGIN
  -- Build metadata with option_groups
  v_metadata := COALESCE(p_option_groups, '[]'::jsonb);
  IF jsonb_array_length(v_metadata) > 0 THEN
    v_metadata := jsonb_build_object('option_groups', v_metadata);
  ELSE
    v_metadata := NULL;
  END IF;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, brand_id, original_url, metadata)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', ''),
      v_metadata
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Reset all existing is_default to false before setting new one
  UPDATE product_variants SET is_default = false WHERE product_id = v_product_id;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Convert option_values from JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_variant->'option_values', '[]'::jsonb))
    ) INTO v_option_values;

    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        option_values = v_option_values,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status, option_values)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status,
        v_option_values
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- Match by sku and name
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'Added option_values column to product_variants' as message;

-- ============================================================================
-- 00047_fix_product_stock_quantity.sql
-- ============================================================================

-- ============================================================================
-- Fix stock_quantity for simple products (no variants)
-- When there are no variants, use p_product->>'stock_quantity' directly
-- When there are variants, sum up variant stock quantities
-- ============================================================================

CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL,
  p_option_groups JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_metadata JSONB;
  v_option_values TEXT[];
  v_has_variants BOOLEAN;
BEGIN
  -- Check if we have variants
  v_has_variants := p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0;

  -- Build metadata with option_groups
  v_metadata := COALESCE(p_option_groups, '[]'::jsonb);
  IF jsonb_array_length(v_metadata) > 0 THEN
    v_metadata := jsonb_build_object('option_groups', v_metadata);
  ELSE
    v_metadata := NULL;
  END IF;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, stock_quantity, status, brand_id, original_url, metadata)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE((p_product->>'stock_quantity')::INT, 0),
      COALESCE(p_product->>'status', 'draft')::product_status,
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', ''),
      v_metadata
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      stock_quantity = COALESCE((p_product->>'stock_quantity')::INT, 0),
      status = COALESCE(p_product->>'status', 'draft')::product_status,
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Reset all existing is_default to false before setting new one
  UPDATE product_variants SET is_default = false WHERE product_id = v_product_id;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Convert option_values from JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_variant->'option_values', '[]'::jsonb))
    ) INTO v_option_values;

    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        option_values = v_option_values,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status, option_values)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status,
        v_option_values
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values
  -- If has variants: use variant SKU and sum of variant stock
  -- If no variants: keep the stock_quantity from p_product (already set above)
  IF v_has_variants THEN
    UPDATE products SET
      sku = v_first_variant_sku,
      stock_quantity = v_total_stock
    WHERE id = v_product_id;
  END IF;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- Match by sku and name
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'Fixed stock_quantity handling for simple products' as message;

-- ============================================================================
-- 00048_events_improvements.sql
-- ============================================================================

-- Migration: Improve events table with new fields
-- Adds: slug, location, image_url, video_url columns

-- Add slug column with unique constraint
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;

-- Add location column
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;

-- Add image_url column
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add video_url column for YouTube embeds
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- If slug is already provided and not empty, use it
    IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
        RETURN NEW;
    END IF;

    -- Generate base slug from title
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\u0400-\u04FF]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    new_slug := base_slug;

    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS events_generate_slug ON events;
CREATE TRIGGER events_generate_slug
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION generate_event_slug();

-- Update existing events without slug
UPDATE events SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9\u0400-\u04FF]+', '-', 'g')) WHERE slug IS NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Grant permissions
GRANT SELECT ON events TO anon;
GRANT ALL ON events TO authenticated;

-- ============================================================================
-- 00049_branches_schema_update.sql
-- ============================================================================

-- ============================================================================
-- BRANCHES SCHEMA UPDATE
-- Update branches table to match frontend design
-- ============================================================================

-- Drop the unique index on is_main first
DROP INDEX IF EXISTS idx_branches_main;

-- Remove old columns
ALTER TABLE branches
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS district,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS is_main,
  DROP COLUMN IF EXISTS working_hours;

-- Add new columns
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS weekday_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS weekend_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_branches_sort_order ON branches(sort_order ASC);

-- ============================================================================
-- DONE!
-- ============================================================================

-- ============================================================================
-- 00050_articles_improvements.sql
-- ============================================================================

-- ============================================================================
-- ARTICLES IMPROVEMENTS
-- Add image_url, type, and is_featured fields for rich article content
-- ============================================================================

-- Add new columns
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured) WHERE is_featured = TRUE;

-- ============================================================================
-- DONE!
-- ============================================================================

-- ============================================================================
-- 00051_update_create_order_from_invoice.sql
-- ============================================================================

-- ============================================================================
-- Update create_order_from_invoice RPC to handle pre-created orders
-- Orders are now created with 'pending' status when invoice is created
-- This RPC should update the order status to 'confirmed' when payment is confirmed
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        -- Check if order exists
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            -- Update invoice status
            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                updated_at = now()
            WHERE id = v_order_id;

            -- Link invoice to order
            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Create order with confirmed status (payment already verified)
    INSERT INTO orders (user_id, order_number, status, payment_status, total_amount)
    VALUES (v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_invoice.amount)
    RETURNING id INTO v_order_id;

    -- Create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_from_invoice(text) TO service_role;
GRANT EXECUTE ON FUNCTION create_order_from_invoice(text) TO authenticated;

-- ============================================================================
-- Update admin notification trigger to fire when order becomes confirmed
-- ============================================================================

-- Update trigger function to check for confirmed status
CREATE OR REPLACE FUNCTION create_admin_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_phone TEXT;
BEGIN
    -- Only send notification when order is confirmed
    -- This handles both INSERT with confirmed status (legacy) and UPDATE from pending to confirmed (new flow)
    IF TG_OP = 'INSERT' AND NEW.status != 'confirmed' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Only trigger on status change to confirmed
        IF OLD.status = 'confirmed' OR NEW.status != 'confirmed' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Get user info
    SELECT
        COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email),
        COALESCE(primary_phone, '')
    INTO v_user_name, v_user_phone
    FROM users
    WHERE id = NEW.user_id;

    -- Create admin notification
    INSERT INTO admin_notifications (type, title, body, metadata)
    VALUES (
        'order',
        'Шинэ захиалга ирлээ',
        format('Захиалга #%s - %s (%s₮)',
            COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)),
            COALESCE(v_user_name, 'Хэрэглэгч'),
            NEW.total_amount::text
        ),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'user_id', NEW.user_id,
            'user_name', v_user_name,
            'user_phone', v_user_phone,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'payment_status', NEW.payment_status
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one that also fires on UPDATE
DROP TRIGGER IF EXISTS trigger_admin_order_notification ON orders;
CREATE TRIGGER trigger_admin_order_notification
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_order_notification();

-- ============================================================================
-- Enable realtime for orders table (for frontend payment status updates)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;

-- ============================================================================
-- 00052_orders_payment_method.sql
-- ============================================================================

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

-- ============================================================================
-- 00053_update_create_order_payment_method.sql
-- ============================================================================

-- Update create_order_from_invoice to set payment_method based on invoice provider

CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        -- Check if order exists
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            -- Update invoice status
            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_order_id;

            -- Link invoice to order
            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Create order with confirmed status (payment already verified)
    INSERT INTO orders (user_id, order_number, status, payment_status, payment_method, total_amount)
    VALUES (v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount)
    RETURNING id INTO v_order_id;

    -- Create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- 00054_banner_background_color.sql
-- ============================================================================

-- Replace title, description, variant with background_color
-- Banner now only needs image and background color

-- 1. Add background_color column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) NOT NULL DEFAULT '#ffffff';

-- 2. Drop unused columns
ALTER TABLE banners
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS variant;

-- Add comment for documentation
COMMENT ON COLUMN banners.background_color IS 'Background color for the banner (hex format, e.g. #ffffff)';

-- ============================================================================
-- 00055_banner_mobile_image.sql
-- ============================================================================

-- Add mobile_image_url column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

-- Add mobile_background_color column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_background_color TEXT;

-- Add comments for documentation
COMMENT ON COLUMN banners.mobile_image_url IS 'Mobile-specific banner image URL';
COMMENT ON COLUMN banners.mobile_background_color IS 'Mobile-specific background color';

-- ============================================================================
-- 00056_fix_best_selling_security.sql
-- ============================================================================

-- Fix best selling products RPC to use SECURITY DEFINER
-- This allows the function to bypass RLS and read all order_items

DROP FUNCTION IF EXISTS get_best_selling_products(int, int);

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_period_days int DEFAULT 7,
  p_limit int DEFAULT 40
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  discount_price numeric,
  sku text,
  barcode text,
  stock_quantity int,
  is_active boolean,
  is_featured boolean,
  brand_id uuid,
  metadata jsonb,
  created_at timestamp,
  updated_at timestamp,
  images text[],
  category_id uuid,
  total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  start_date timestamp := now() - (p_period_days || ' days')::interval;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT
      oi.product_id,
      SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= start_date
      AND o.status != 'canceled'
    GROUP BY oi.product_id
  )
  SELECT
    p.id,
    p.name::text,
    p.slug::text,
    p.description::text,
    p.price,
    p.discount_price,
    p.sku::text,
    p.barcode::text,
    p.stock_quantity,
    p.is_active,
    p.is_featured,
    p.brand_id,
    p.metadata,
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order)
       FROM product_images pi
       WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
      '{}'::text[]
    ) AS images,
    (SELECT pc.category_id FROM product_categories pc WHERE pc.product_id = p.id LIMIT 1) AS category_id,
    COALESCE(s.total_sold, 0::bigint) AS total_sold
  FROM products p
  INNER JOIN sales s ON s.product_id = p.id
  WHERE p.is_active = true
    AND s.total_sold > 0
  ORDER BY s.total_sold DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO anon;
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO authenticated;

-- ============================================================================
-- 00057_enable_orders_realtime.sql
-- ============================================================================

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

-- ============================================================================
-- 00058_search_all_words_match.sql
-- ============================================================================

-- ============================================================================
-- Improve search to match all words in query (not just consecutive)
-- ============================================================================
-- Example: searching "medicube body wash" will now match "medicube red acne body wash"
-- because all three words (medicube, body, wash) are present in the product name

DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

-- Helper function to check if all search words are present in text
CREATE OR REPLACE FUNCTION check_all_words_match(p_text text, p_search_words text[])
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_word text;
  v_lower_text text := lower(p_text);
BEGIN
  IF p_search_words IS NULL OR array_length(p_search_words, 1) IS NULL THEN
    RETURN true;
  END IF;

  FOREACH v_word IN ARRAY p_search_words LOOP
    IF v_lower_text NOT LIKE '%' || v_word || '%' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_search_words text[];
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(lower(trim(p_search_query)), ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.discount_price,
      COALESCE(
        (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
        '{}'::text[]
      ) AS images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      -- Check if all words match in name OR description
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.discount_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM (
    SELECT DISTINCT ON (matched.id)
      matched.*
    FROM matched
  ) m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- Also update search_suggestions to use the same all-words-match logic
CREATE OR REPLACE FUNCTION search_suggestions(p_search_query text, p_max_results int DEFAULT 8)
RETURNS TABLE(type text, text text, slug text, image text, similarity real)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_search_words text[];
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(lower(trim(p_search_query)), ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  RETURN QUERY
  (
    SELECT
      'product'::text AS type,
      p.name::text AS text,
      p.slug::text,
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL ORDER BY pi.sort_order LIMIT 1)::text AS image,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity
    FROM products p
    WHERE p.is_active = true
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
      )
    ORDER BY similarity DESC
    LIMIT p_max_results
  )
  UNION ALL
  (
    SELECT
      'category'::text AS type,
      c.name::text AS text,
      c.slug::text,
      c.image::text,
      similarity(c.name, p_search_query)::real AS similarity
    FROM categories c
    WHERE c.is_active = true
      AND check_all_words_match(c.name, v_search_words)
    ORDER BY similarity DESC
    LIMIT 3
  )
  UNION ALL
  (
    SELECT
      'brand'::text AS type,
      b.name::text AS text,
      b.slug::text,
      b.logo_url::text AS image,
      similarity(b.name, p_search_query)::real AS similarity
    FROM brands b
    WHERE check_all_words_match(b.name, v_search_words)
    ORDER BY similarity DESC
    LIMIT 3
  )
  ORDER BY similarity DESC
  LIMIT p_max_results;
END;
$$;

-- ============================================================================
-- 00059_banner_type.sql
-- ============================================================================

-- Add type column to banners table to distinguish carousel vs promo banners
-- type: 'carousel' (default) for main carousel, 'promo' for promotional banners shown below categories

ALTER TABLE banners ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'carousel'
  CHECK (type IN ('carousel', 'promo'));

-- Add index for efficient type filtering
CREATE INDEX IF NOT EXISTS idx_banners_type ON banners(type);

-- Add comment for documentation
COMMENT ON COLUMN banners.type IS 'Banner type: carousel (main slider) or promo (promotional banner in page)';

-- ============================================================================
-- 00060_add_order_id_to_notifications.sql
-- ============================================================================

-- Add order_id column to notifications table so notifications can link to specific orders
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);

-- ============================================================================
-- 00061_cart_items.sql
-- ============================================================================

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

-- ============================================================================
-- 00062_payment_invoices_order_fk.sql
-- ============================================================================

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

-- ============================================================================
-- 00063_fix_timestamp_to_timestamptz.sql
-- ============================================================================

-- ============================================================================
-- Fix TIMESTAMP columns to TIMESTAMPTZ
--
-- Problem: TIMESTAMP (without timezone) columns store UTC time from NOW() but
-- Supabase returns them without timezone indicator. JavaScript's new Date()
-- parses them as local time, causing an 8-hour offset for Asia/Ulaanbaatar.
--
-- Solution: ALTER to TIMESTAMPTZ. PostgreSQL treats existing TIMESTAMP values
-- as being in the session timezone (UTC on Supabase), so conversion is correct.
-- After this, Supabase returns timestamps with +00:00 suffix and JS parses
-- them correctly as UTC.
-- ============================================================================

-- Orders table
ALTER TABLE orders
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Admin notifications table
ALTER TABLE admin_notifications
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- ============================================================================
-- 00064_user_coupons.sql
-- ============================================================================

-- ============================================================================
-- USER COUPONS: Users claim coupons by entering codes
-- ============================================================================

-- Table for tracking which coupons users have claimed
CREATE TABLE user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, coupon_id)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon ON user_coupons(coupon_id);

-- RLS
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_coupons_select_own" ON user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_coupons_insert_own" ON user_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_coupons_delete_own" ON user_coupons
  FOR DELETE USING (auth.uid() = user_id);

-- Make coupons.name nullable (admin no longer needs to provide it)
ALTER TABLE coupons ALTER COLUMN name DROP NOT NULL;
ALTER TABLE coupons ALTER COLUMN name SET DEFAULT '';

-- Grant access to anon and authenticated
GRANT SELECT, INSERT, DELETE ON user_coupons TO authenticated;
GRANT SELECT ON user_coupons TO anon;

-- ============================================================================
-- 00065_orders_delivery_address.sql
-- ============================================================================

-- Add delivery address snapshot fields to orders table
-- These capture the address at checkout time, rather than relying on the user's current address

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_sub_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_detail TEXT;

-- ============================================================================
-- 00066_update_create_order_with_address.sql
-- ============================================================================

-- Update create_order_from_invoice to include delivery address from pending_order_data

CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        -- Check if order exists
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            -- Update invoice status
            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_order_id;

            -- Link invoice to order
            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Extract address from pending_order_data
    v_address := v_invoice.pending_order_data->'address';

    -- Create order with confirmed status (payment already verified) and delivery address
    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail'
    )
    RETURNING id INTO v_order_id;

    -- Create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- 00067_fix_search_price_filter_discount.sql
-- ============================================================================

-- Fix search_products price filter to use discount_price when available
-- Previously it always filtered on original price, ignoring discounted prices

DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_search_words text[];
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(lower(trim(p_search_query)), ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.name::text,
      p.slug::text,
      p.price,
      p.discount_price,
      COALESCE(
        (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
        '{}'::text[]
      ) AS images,
      p.is_featured,
      p.stock_quantity,
      c.name::text AS category_name,
      c.slug::text AS category_slug,
      greatest(
        similarity(p.name, p_search_query),
        similarity(coalesce(p.description, ''), p_search_query) * 0.5
      )::real AS similarity,
      p.created_at
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      -- Check if all words match in name OR description
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price >= p_min_price
          ELSE p.price >= p_min_price
        END)
      AND (p_max_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price <= p_max_price
          ELSE p.price <= p_max_price
        END)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
  )
  SELECT
    m.id, m.name, m.slug, m.price, m.discount_price,
    m.images, m.is_featured, m.stock_quantity,
    m.category_name, m.category_slug, m.similarity,
    count(*) OVER() AS total_count
  FROM (
    SELECT DISTINCT ON (matched.id)
      matched.*
    FROM matched
  ) m
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
    m.similarity DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$;

-- ============================================================================
-- 00068_product_performance_rpc.sql
-- ============================================================================

-- Product performance RPC: server-side aggregation with pagination, sorting, search
-- Supports date range filtering for order-based metrics

DROP FUNCTION IF EXISTS get_product_performance(text, text, text, int, int);

CREATE OR REPLACE FUNCTION get_product_performance(
  p_search text DEFAULT NULL,
  p_sort_column text DEFAULT 'qty_sold',
  p_sort_dir text DEFAULT 'desc',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount_price numeric,
  status text,
  qty_sold bigint,
  revenue numeric,
  stock bigint,
  variant_count bigint,
  avg_rating numeric,
  review_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH product_sales AS (
    SELECT
      oi.product_id,
      COALESCE(SUM(oi.quantity), 0)::bigint AS qty_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'canceled'
      AND o.payment_status = 'paid'
      AND (p_date_from IS NULL OR o.created_at >= p_date_from)
      AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    GROUP BY oi.product_id
  ),
  product_reviews AS (
    SELECT
      r.product_id,
      AVG(r.rating)::numeric AS avg_rating,
      COUNT(*)::bigint AS review_count
    FROM reviews r
    WHERE r.status = 'active'
    GROUP BY r.product_id
  ),
  product_stock AS (
    SELECT
      p.id AS product_id,
      CASE
        WHEN COUNT(pv.id) > 0 THEN COALESCE(SUM(pv.stock_quantity), 0)
        ELSE COALESCE(p.stock_quantity, 0)
      END::bigint AS stock,
      COUNT(pv.id)::bigint AS variant_count
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id, p.stock_quantity
  ),
  filtered AS (
    SELECT
      p.id,
      p.name::text,
      p.price,
      p.discount_price,
      p.status::text,
      COALESCE(ps.qty_sold, 0::bigint) AS qty_sold,
      COALESCE(ps.revenue, 0::numeric) AS revenue,
      COALESCE(st.stock, 0::bigint) AS stock,
      COALESCE(st.variant_count, 0::bigint) AS variant_count,
      pr.avg_rating,
      COALESCE(pr.review_count, 0::bigint) AS review_count
    FROM products p
    LEFT JOIN product_sales ps ON ps.product_id = p.id
    LEFT JOIN product_reviews pr ON pr.product_id = p.id
    LEFT JOIN product_stock st ON st.product_id = p.id
    WHERE (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%')
  )
  SELECT
    f.id,
    f.name,
    f.price,
    f.discount_price,
    f.status,
    f.qty_sold,
    f.revenue,
    f.stock,
    f.variant_count,
    f.avg_rating,
    f.review_count,
    COUNT(*) OVER()::bigint AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort_dir = 'asc' THEN
      CASE p_sort_column
        WHEN 'name' THEN f.name
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_dir = 'desc' THEN
      CASE p_sort_column
        WHEN 'name' THEN f.name
      END
    END DESC NULLS LAST,
    CASE WHEN p_sort_dir = 'asc' THEN
      CASE p_sort_column
        WHEN 'price' THEN f.price
        WHEN 'qty_sold' THEN f.qty_sold::numeric
        WHEN 'revenue' THEN f.revenue
        WHEN 'stock' THEN f.stock::numeric
        WHEN 'variant_count' THEN f.variant_count::numeric
        WHEN 'avg_rating' THEN COALESCE(f.avg_rating, -1)
        WHEN 'review_count' THEN f.review_count::numeric
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_dir = 'desc' THEN
      CASE p_sort_column
        WHEN 'price' THEN f.price
        WHEN 'qty_sold' THEN f.qty_sold::numeric
        WHEN 'revenue' THEN f.revenue
        WHEN 'stock' THEN f.stock::numeric
        WHEN 'variant_count' THEN f.variant_count::numeric
        WHEN 'avg_rating' THEN COALESCE(f.avg_rating, -1)
        WHEN 'review_count' THEN f.review_count::numeric
      END
    END DESC NULLS LAST,
    f.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_performance(text, text, text, int, int, timestamptz, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION get_product_performance(text, text, text, int, int, timestamptz, timestamptz) TO authenticated;

-- ============================================================================
-- 00069_coupon_brands.sql
-- ============================================================================

-- Coupon Brands junction table (for brand scope)
CREATE TABLE IF NOT EXISTS coupon_brands (
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, brand_id)
);

ALTER TABLE coupon_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_brands_select" ON coupon_brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupon_brands_insert" ON coupon_brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coupon_brands_delete" ON coupon_brands FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 00069_orders_is_printed.sql
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 00070_coupon_max_applicable_qty.sql
-- ============================================================================

-- Add max_applicable_qty to coupons: limits how many units get the discount
-- NULL = unlimited (all matching items, backward compatible)
ALTER TABLE coupons ADD COLUMN max_applicable_qty INTEGER DEFAULT NULL;

-- ============================================================================
-- 00070_variant_sales_rpc.sql
-- ============================================================================

-- Variant sales breakdown for a single product
-- Returns all active variants with their sales data (0 if none)

CREATE OR REPLACE FUNCTION get_variant_sales(
  p_product_id uuid,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  variant_id uuid,
  variant_name text,
  price numeric,
  discount_price numeric,
  stock_quantity int,
  qty_sold bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id AS variant_id,
    pv.name::text AS variant_name,
    pv.price,
    pv.discount_price,
    pv.stock_quantity,
    COALESCE(SUM(oi.quantity), 0)::bigint AS qty_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
  FROM product_variants pv
  LEFT JOIN order_items oi
    ON oi.variant_id = pv.id
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = oi.order_id
        AND o.status != 'canceled'
        AND o.payment_status = 'paid'
        AND (p_date_from IS NULL OR o.created_at >= p_date_from)
        AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    )
  WHERE pv.product_id = p_product_id
    AND pv.status = 'active'
  GROUP BY pv.id, pv.name, pv.price, pv.discount_price, pv.stock_quantity
  ORDER BY qty_sold DESC, pv.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_sales(uuid, timestamptz, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION get_variant_sales(uuid, timestamptz, timestamptz) TO authenticated;

-- ============================================================================
-- 00071_stock_decrement_on_order_confirm.sql
-- ============================================================================

-- ============================================================================
-- Auto-decrement product stock when order is confirmed (payment verified)
-- ============================================================================

-- 1. Add stock_decremented flag for idempotency
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_decremented BOOLEAN DEFAULT FALSE;

-- 2. Create reusable stock decrement helper
CREATE OR REPLACE FUNCTION decrement_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item record;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.variant_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = p_order_id
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            -- Variant product: decrement variant stock
            UPDATE product_variants
            SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity)
            WHERE id = v_item.variant_id;

            -- Sync parent product stock = SUM of all variant stocks
            UPDATE products
            SET stock_quantity = COALESCE(
                (SELECT SUM(pv.stock_quantity)
                 FROM product_variants pv
                 WHERE pv.product_id = v_item.product_id
                   AND pv.status = 'active'),
                0
            )
            WHERE id = v_item.product_id;
        ELSE
            -- Simple product (no variant): decrement product stock directly
            UPDATE products
            SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity)
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;
END;
$$;

-- 3. Updated create_order_from_invoice with stock decrement
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            -- Update invoice status
            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            -- Link invoice to order
            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Extract address from pending_order_data
    v_address := v_invoice.pending_order_data->'address';

    -- Create order with confirmed status (payment already verified) and delivery address
    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true
    )
    RETURNING id INTO v_order_id;

    -- Create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    -- Decrement stock for newly created order
    PERFORM decrement_order_stock(v_order_id);

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- 00072_unique_order_number.sql
-- ============================================================================

-- Add UNIQUE constraint to orders.order_number to prevent duplicates
-- First clean up any existing duplicates (keep the newest one)
WITH duplicates AS (
    SELECT id, order_number,
           ROW_NUMBER() OVER (PARTITION BY order_number ORDER BY created_at DESC) AS rn
    FROM orders
    WHERE order_number IS NOT NULL
)
UPDATE orders
SET order_number = order_number || '-' || substring(gen_random_uuid()::text from 1 for 4)
FROM duplicates
WHERE orders.id = duplicates.id AND duplicates.rn > 1;

-- Now add the unique constraint
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);

-- ============================================================================
-- 00073_orders_delivery_fee.sql
-- ============================================================================

ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ============================================================================
-- 00074_add_storepay_payment_method.sql
-- ============================================================================

-- Add 'storepay' to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'storepay';

-- ============================================================================
-- 00074_monpang_points.sql
-- ============================================================================

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

-- ============================================================================
-- 00075_point_activation.sql
-- ============================================================================

-- Add point activation tracking column to users table
-- NULL = not activated, non-NULL = activated at that timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS point_activated_at TIMESTAMPTZ;

-- ============================================================================
-- 00076_point_notification_trigger.sql
-- ============================================================================

-- ============================================================================
-- Auto-create user notification when points are added
-- ============================================================================

-- Trigger function: creates a notification row for positive point transactions
CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'promotional' AND NEW.description = 'Шинэ хэрэглэгчийн бонус' THEN
    -- Welcome bonus (new user activation)
    v_title := 'Танд 10,000 MPoint бэлэг 🎁';
    v_body := 'Monpang-д тавтай морил! Шинэ хэрэглэгч болсонд тань 10K MPoint бэлэглэлээ.';
  ELSIF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (NEW.user_id, 'promotion', v_title, v_body);

  RETURN NEW;
END;
$$;

-- Attach trigger to point_transactions table
CREATE TRIGGER trg_point_transaction_notification
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_point_notification();

-- Ensure service_role can insert notifications
GRANT INSERT ON notifications TO service_role;

-- ============================================================================
-- 00077_notification_metadata.sql
-- ============================================================================

-- Add metadata JSONB column to notifications table for structured data
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- ============================================================================
-- 00078_point_notification_metadata.sql
-- ============================================================================

-- Update point notification trigger to include metadata with admin description
CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_metadata JSONB;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'promotional' AND NEW.description = 'Шинэ хэрэглэгчийн бонус' THEN
    -- Welcome bonus (new user activation)
    v_title := 'Танд 10,000 MPoint бэлэг 🎁';
    v_body := 'Monpang-д тавтай морил! Шинэ хэрэглэгч болсонд тань 10K MPoint бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'welcome_bonus',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'earned',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'admin_gift',
      'amount', NEW.amount,
      'description', COALESCE(NEW.description, '')
    );
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
    v_metadata := jsonb_build_object(
      'sub_type', 'refund',
      'amount', NEW.amount
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (NEW.user_id, 'promotion', v_title, v_body, v_metadata);

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 00079_orders_point_coupon_info.sql
-- ============================================================================

-- Store point/coupon info on orders for payment retry support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0;

-- ============================================================================
-- 00080_fix_best_selling_active_filter.sql
-- ============================================================================

-- Fix best selling products RPC to ensure inactive and out-of-stock products are excluded
-- Re-create with SECURITY DEFINER and strict active/stock filtering

DROP FUNCTION IF EXISTS get_best_selling_products(int, int);

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_period_days int DEFAULT 7,
  p_limit int DEFAULT 40
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  discount_price numeric,
  sku text,
  barcode text,
  stock_quantity int,
  is_active boolean,
  is_featured boolean,
  brand_id uuid,
  metadata jsonb,
  created_at timestamp,
  updated_at timestamp,
  images text[],
  category_id uuid,
  total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  start_date timestamp := now() - (p_period_days || ' days')::interval;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT
      oi.product_id,
      SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= start_date
      AND o.status != 'canceled'
    GROUP BY oi.product_id
  )
  SELECT
    p.id,
    p.name::text,
    p.slug::text,
    p.description::text,
    p.price,
    p.discount_price,
    p.sku::text,
    p.barcode::text,
    p.stock_quantity,
    p.is_active,
    p.is_featured,
    p.brand_id,
    p.metadata,
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order)
       FROM product_images pi
       WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
      '{}'::text[]
    ) AS images,
    (SELECT pc.category_id FROM product_categories pc WHERE pc.product_id = p.id LIMIT 1) AS category_id,
    COALESCE(s.total_sold, 0::bigint) AS total_sold
  FROM products p
  INNER JOIN sales s ON s.product_id = p.id
  WHERE p.is_active = true
    AND s.total_sold > 0
    AND p.stock_quantity > 0
  ORDER BY s.total_sold DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO anon;
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO authenticated;

-- ============================================================================
-- 00081_sync_is_active_trigger.sql
-- ============================================================================

-- ============================================================================
-- Add trigger to automatically sync products.is_active with products.status
-- Previously, direct updates to status (via admin API PATCH or raw SQL) did NOT
-- update is_active, causing active products to be invisible on frontend/mobile.
-- ============================================================================

-- Trigger function: keep is_active in sync with status on every UPDATE
CREATE OR REPLACE FUNCTION sync_product_is_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.is_active := (NEW.status = 'active');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (BEFORE UPDATE so we can modify NEW row)
DROP TRIGGER IF EXISTS trg_sync_product_is_active ON products;
CREATE TRIGGER trg_sync_product_is_active
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_is_active();

-- One-time fix: sync any currently out-of-sync records
UPDATE products SET is_active = (status = 'active')
WHERE is_active != (status = 'active');

-- ============================================================================
-- 00082_orders_paid_at.sql
-- ============================================================================

-- ============================================================================
-- Add paid_at timestamp to orders + update RPC to set it on payment confirm
-- ============================================================================

-- 1. Add paid_at column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 2. Backfill from payment_invoices.updated_at for existing paid orders
UPDATE orders o
SET paid_at = pi.updated_at
FROM payment_invoices pi
WHERE pi.order_id = o.id
  AND pi.status = 'paid'
  AND o.payment_status = 'paid'
  AND o.paid_at IS NULL;

-- 3. Index for sorting
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders (paid_at DESC NULLS LAST);

-- 4. Updated create_order_from_invoice with paid_at + storepay provider mapping
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            -- Update order status to confirmed and payment_status to paid
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            -- Update invoice status
            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            -- Update order status
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            -- Decrement stock only if order status actually changed (idempotent)
            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            -- Link invoice to order
            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    -- Generate order number if not present
    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    -- Extract address from pending_order_data
    v_address := v_invoice.pending_order_data->'address';

    -- Create order with confirmed status (payment already verified) and delivery address
    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented, paid_at
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true, now()
    )
    RETURNING id INTO v_order_id;

    -- Create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    -- Decrement stock for newly created order
    PERFORM decrement_order_stock(v_order_id);

    -- Link invoice to the new order
    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- 20260202000000_create_payment_invoices.sql
-- ============================================================================

create table if not exists payment_invoices (
  id text primary key,
  user_id uuid not null references auth.users(id),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_amount numeric,
  transaction_id text,
  payment_wallet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payment_invoices enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Users can read own invoices') then
    create policy "Users can read own invoices" on payment_invoices for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Users can insert own invoices') then
    create policy "Users can insert own invoices" on payment_invoices for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Service role can update invoices') then
    create policy "Service role can update invoices" on payment_invoices for update using (true);
  end if;
end $$;

-- ============================================================================
-- 20260304000000_brands_created_at.sql
-- ============================================================================

-- brands table-д created_at column нэмэх (шинэ брэндийг эхэнд харуулахын тулд)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 20260316000000_fix_point_transactions_fk.sql
-- ============================================================================

-- Fix: point_transactions.user_id references auth.users instead of public.users
-- This prevents PostgREST from resolving the join with public.users table
-- (all other tables correctly reference public.users)

-- Drop the existing FK to auth.users
ALTER TABLE point_transactions
    DROP CONSTRAINT IF EXISTS point_transactions_user_id_fkey;

-- Add FK to public.users instead
ALTER TABLE point_transactions
    ADD CONSTRAINT point_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id);

-- ============================================================================
-- 20260316100000_activate_points_rpc.sql
-- ============================================================================

-- RPC function for point activation.
-- Uses SECURITY DEFINER to bypass RLS (same as frontend's createAdminClient).
-- Called from mobile app since client-side inserts are blocked by RLS.

CREATE OR REPLACE FUNCTION activate_points(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_activated_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Check preconditions
  SELECT primary_phone, point_activated_at
  INTO v_phone, v_activated_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'phone_not_verified');
  END IF;

  IF v_activated_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_activated');
  END IF;

  -- Set point_activated_at
  UPDATE users
  SET point_activated_at = NOW()
  WHERE id = p_user_id;

  -- Insert welcome bonus transaction
  INSERT INTO point_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'promotional', 10000, 'Шинэ хэрэглэгчийн бонус');

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  -- Rollback activation on failure
  UPDATE users
  SET point_activated_at = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION activate_points(UUID) TO authenticated;

-- ============================================================================
-- 20260317000000_remove_welcome_bonus.sql
-- ============================================================================

-- Remove 10,000 point welcome bonus from activation flow.
-- Point activation still sets point_activated_at, but no longer inserts a bonus transaction.

-- 1) Update activate_points RPC: remove the welcome bonus INSERT
CREATE OR REPLACE FUNCTION activate_points(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_activated_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Check preconditions
  SELECT primary_phone, point_activated_at
  INTO v_phone, v_activated_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'phone_not_verified');
  END IF;

  IF v_activated_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_activated');
  END IF;

  -- Set point_activated_at
  UPDATE users
  SET point_activated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  -- Rollback activation on failure
  UPDATE users
  SET point_activated_at = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2) Update notification trigger: remove welcome bonus case
CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_metadata JSONB;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'earned',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'admin_gift',
      'amount', NEW.amount,
      'description', COALESCE(NEW.description, '')
    );
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
    v_metadata := jsonb_build_object(
      'sub_type', 'refund',
      'amount', NEW.amount
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (NEW.user_id, 'promotion', v_title, v_body, v_metadata);

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 20260317100000_push_notification_triggers.sql
-- ============================================================================

-- ============================================================================
-- Push notification triggers: send FCM push via edge function
-- when notifications or order status changes are created.
-- ============================================================================

-- 1. Trigger for notifications table INSERT
--    Sends push notification to user when a new notification row is created.
CREATE OR REPLACE FUNCTION send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'data', jsonb_build_object(
        'type', NEW.type::text,
        'id', COALESCE(NEW.order_id::text, NEW.id::text)
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_on_notification();


-- 2. Trigger for order_status_history INSERT
--    Looks up user_id and order_number, generates title/body, sends push.
CREATE OR REPLACE FUNCTION send_push_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order_number TEXT;
  v_short_id TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Look up order owner and order number
  SELECT user_id, order_number
  INTO v_user_id, v_order_number
  FROM orders
  WHERE id = NEW.order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_short_id := UPPER(LEFT(COALESCE(v_order_number, ''), 8));

  -- Generate title based on new_status
  v_title := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Баталгаажсан'
    WHEN 'shipped'   THEN 'Хүргэлтэд гарсан'
    WHEN 'delivered'  THEN 'Хүргэгдсэн'
    WHEN 'canceled'   THEN 'Цуцлагдсан'
    WHEN 'paid'       THEN 'Төлбөр төлөгдсөн'
    WHEN 'failed'     THEN 'Төлбөр амжилтгүй'
    WHEN 'pending'    THEN 'Хүлээгдэж байна'
    ELSE 'Статус өөрчлөгдсөн'
  END;

  -- Generate body
  v_body := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Таны #' || v_short_id || ' захиалга баталгаажлаа.'
    WHEN 'shipped'   THEN 'Таны #' || v_short_id || ' захиалга хүргэлтэд гарлаа.'
    WHEN 'delivered'  THEN 'Таны #' || v_short_id || ' захиалга хүргэгдлээ.'
    WHEN 'canceled'   THEN 'Таны #' || v_short_id || ' захиалга цуцлагдсан.'
    WHEN 'paid'       THEN 'Таны #' || v_short_id || ' захиалгын төлбөр төлөгдсөн.'
    WHEN 'failed'     THEN 'Таны #' || v_short_id || ' захиалгын төлбөр амжилтгүй.'
    WHEN 'pending'    THEN 'Таны #' || v_short_id || ' захиалга хүлээгдэж байна.'
    ELSE 'Таны #' || v_short_id || ' захиалгын статус өөрчлөгдсөн.'
  END;

  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', v_user_id,
      'title', v_title,
      'body', v_body,
      'data', jsonb_build_object(
        'type', 'order',
        'id', NEW.order_id::text
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_on_status_change
  AFTER INSERT ON order_status_history
  FOR EACH ROW
  EXECUTE FUNCTION send_push_on_status_change();

-- ============================================================================
-- 20260318000000_point_usage_rpcs.sql
-- ============================================================================

-- RPC functions for recording point usage and awarding points after purchase.
-- Uses SECURITY DEFINER to bypass RLS (same pattern as activate_points).
-- Called from mobile app since client-side inserts are blocked by RLS.

-- 1. Record point usage (deduction) for an order
CREATE OR REPLACE FUNCTION record_point_usage(
  p_user_id UUID,
  p_order_id UUID,
  p_order_number TEXT,
  p_points_used INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Idempotency: check for existing 'used' transaction for this order
  IF EXISTS (
    SELECT 1 FROM point_transactions
    WHERE order_id = p_order_id AND type = 'used'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_exists', true);
  END IF;

  -- Verify sufficient balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM point_transactions
  WHERE user_id = p_user_id;

  IF v_balance < p_points_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  -- Insert usage transaction (negative amount)
  INSERT INTO point_transactions (user_id, order_id, type, amount, description)
  VALUES (p_user_id, p_order_id, 'used', -p_points_used, 'Захиалга #' || p_order_number);

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION record_point_usage(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 2. Award 2% points for a completed order
CREATE OR REPLACE FUNCTION award_points_for_order(
  p_user_id UUID,
  p_order_id UUID,
  p_order_number TEXT,
  p_order_total NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned INTEGER;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Calculate 2% reward
  v_earned := FLOOR(p_order_total * 0.02);
  IF v_earned <= 0 THEN
    RETURN jsonb_build_object('success', true, 'earned', 0);
  END IF;

  -- Idempotency: check for existing 'earned' transaction for this order
  IF EXISTS (
    SELECT 1 FROM point_transactions
    WHERE order_id = p_order_id AND type = 'earned'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_exists', true, 'earned', v_earned);
  END IF;

  -- Insert earned transaction
  INSERT INTO point_transactions (user_id, order_id, type, amount, description)
  VALUES (p_user_id, p_order_id, 'earned', v_earned, 'Захиалга #' || p_order_number);

  RETURN jsonb_build_object('success', true, 'earned', v_earned);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION award_points_for_order(UUID, UUID, TEXT, NUMERIC) TO authenticated;

-- ============================================================================
-- 20260319000000_add_welcome_bonus_5000.sql
-- ============================================================================

-- Add 5,000 point welcome bonus back to point activation.
-- Awarded once when user activates points (requires verified phone).

CREATE OR REPLACE FUNCTION activate_points(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_activated_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Check preconditions
  SELECT primary_phone, point_activated_at
  INTO v_phone, v_activated_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'phone_not_verified');
  END IF;

  IF v_activated_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_activated');
  END IF;

  -- Set point_activated_at
  UPDATE users
  SET point_activated_at = NOW()
  WHERE id = p_user_id;

  -- Insert 5,000 point welcome bonus
  INSERT INTO point_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'promotional', 5000, 'Шинэ хэрэглэгчийн бонус');

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- 20260319100000_sync_product_is_active.sql
-- ============================================================================

-- ============================================================================
-- FIX: Sync is_active with status in save_product function
-- The save_product RPC was only updating products.status but never
-- products.is_active, causing inactive/draft products to still appear
-- on the frontend and mobile app (which filter on is_active = true).
-- ============================================================================

-- First, fix any existing out-of-sync products
UPDATE products SET is_active = (status = 'active');

-- Recreate save_product with is_active sync
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_status product_status;
BEGIN
  -- Resolve status once
  v_status := COALESCE(p_product->>'status', 'draft')::product_status;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, status, is_active, brand_id, original_url)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      v_status,
      (v_status = 'active'),
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', '')
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      status = v_status,
      is_active = (v_status = 'active'),
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values: sku, stock_quantity (NO images)
  UPDATE products SET
    sku = v_first_variant_sku,
    stock_quantity = v_total_stock
  WHERE id = v_product_id;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

SELECT 'save_product updated: is_active now syncs with status' as message;

-- ============================================================================
-- 20260319200000_add_free_payment_method.sql
-- ============================================================================

-- Add 'free' payment method for orders fully covered by points/coupons
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'free';

-- ============================================================================
-- 20260327000000_delete_user_rpc.sql
-- ============================================================================

-- Soft-delete user account: clears personal data, deletes orders/addresses/etc,
-- but keeps point_transactions, user_coupons, primary_phone, and point_activated_at
-- so the user can re-login with the same phone and retain points/coupons
-- without receiving the welcome bonus again.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Nullify order refs in point_transactions (keep transactions, remove order link)
  UPDATE point_transactions SET order_id = NULL WHERE user_id = v_user_id;

  -- 2. Delete payments (RESTRICT on orders.id — must delete before orders)
  DELETE FROM payments
  WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);

  -- 3. Delete payment_invoices for user's orders
  DELETE FROM payment_invoices
  WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);

  -- 4. Delete orders (cascades to: order_items, order_status_history)
  --    (SET NULL on: coupon_usages.order_id, notifications.order_id)
  DELETE FROM orders WHERE user_id = v_user_id;

  -- 5. Delete remaining user data
  DELETE FROM notifications WHERE user_id = v_user_id;
  DELETE FROM addresses WHERE user_id = v_user_id;
  DELETE FROM wishlists WHERE user_id = v_user_id;
  DELETE FROM reviews WHERE user_id = v_user_id;
  DELETE FROM cart_items WHERE user_id = v_user_id;

  -- 6. KEEP: point_transactions, user_coupons, coupon_usages (usage tracking)

  -- 7. Soft-delete: clear personal info, keep phone + point_activated_at
  UPDATE users SET
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    avatar_url = NULL,
    secondary_phone = NULL,
    status = 'inactive',
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$;

-- ============================================================================
-- 20260327100000_fcm_token_and_fix_push_triggers.sql
-- ============================================================================

-- ============================================================================
-- Fix push notifications:
-- 1. Add missing fcm_token column to users table
-- 2. Add Authorization header to push notification triggers
-- ============================================================================

-- 1. Add fcm_token column (was never created, causing token sync to fail)
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Store anon key in vault for trigger Authorization headers
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTcyOTIsImV4cCI6MjA4Mzc3MzI5Mn0.eRaN0JNpNEIguPxWyauPvhoX0_eccnq3f_8HWp5o-v8',
  'anon_key'
);

-- 3. Recreate notification trigger function with Authorization header
CREATE OR REPLACE FUNCTION send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'anon_key'
      )
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'data', jsonb_build_object(
        'type', NEW.type::text,
        'id', COALESCE(NEW.order_id::text, NEW.id::text)
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- 4. Recreate status change trigger function with Authorization header
CREATE OR REPLACE FUNCTION send_push_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order_number TEXT;
  v_short_id TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  SELECT user_id, order_number
  INTO v_user_id, v_order_number
  FROM orders
  WHERE id = NEW.order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_short_id := UPPER(LEFT(COALESCE(v_order_number, ''), 8));

  v_title := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Баталгаажсан'
    WHEN 'shipped'   THEN 'Хүргэлтэд гарсан'
    WHEN 'delivered'  THEN 'Хүргэгдсэн'
    WHEN 'canceled'   THEN 'Цуцлагдсан'
    WHEN 'paid'       THEN 'Төлбөр төлөгдсөн'
    WHEN 'failed'     THEN 'Төлбөр амжилтгүй'
    WHEN 'pending'    THEN 'Хүлээгдэж байна'
    ELSE 'Статус өөрчлөгдсөн'
  END;

  v_body := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Таны #' || v_short_id || ' захиалга баталгаажлаа.'
    WHEN 'shipped'   THEN 'Таны #' || v_short_id || ' захиалга хүргэлтэд гарлаа.'
    WHEN 'delivered'  THEN 'Таны #' || v_short_id || ' захиалга хүргэгдлээ.'
    WHEN 'canceled'   THEN 'Таны #' || v_short_id || ' захиалга цуцлагдсан.'
    WHEN 'paid'       THEN 'Таны #' || v_short_id || ' захиалгын төлбөр төлөгдсөн.'
    WHEN 'failed'     THEN 'Таны #' || v_short_id || ' захиалгын төлбөр амжилтгүй.'
    WHEN 'pending'    THEN 'Таны #' || v_short_id || ' захиалга хүлээгдэж байна.'
    ELSE 'Таны #' || v_short_id || ' захиалгын статус өөрчлөгдсөн.'
  END;

  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'anon_key'
      )
    ),
    body := jsonb_build_object(
      'user_id', v_user_id,
      'title', v_title,
      'body', v_body,
      'data', jsonb_build_object(
        'type', 'order',
        'id', NEW.order_id::text
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- Triggers already exist from 20260317100000, no need to recreate them.
-- CREATE OR REPLACE FUNCTION updates the function that existing triggers call.

-- ============================================================================
-- 20260327200000_fix_welcome_bonus_notification.sql
-- ============================================================================

-- Fix: welcome bonus notification was falling through to admin_gift
-- because exact string comparison failed (encoding/whitespace).
-- Use ILIKE for robust matching + update title/body to reflect 5,000 amount.

CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_metadata JSONB;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'promotional' AND NEW.description ILIKE '%Шинэ хэрэглэгчийн бонус%' THEN
    -- Welcome bonus (new user activation) — no gift dialog needed,
    -- the success dialog in the app already handles this.
    v_title := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' MPoint бэлэг 🎁';
    v_body := 'Monpang-д тавтай морил! Шинэ хэрэглэгч болсонд тань '
              || to_char(NEW.amount, 'FM999,999') || ' MPoint бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'welcome_bonus',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'earned',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'admin_gift',
      'amount', NEW.amount,
      'description', COALESCE(NEW.description, '')
    );
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
    v_metadata := jsonb_build_object(
      'sub_type', 'refund',
      'amount', NEW.amount
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (NEW.user_id, 'promotion', v_title, v_body, v_metadata);

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 20260331000000_products_rls_allow_all_reads.sql
-- ============================================================================

-- Allow reading ALL products regardless of status
-- Inactive products are already filtered at application level (.eq("is_active", true))
-- This fix ensures order details can display product info for inactive/draft products

DROP POLICY IF EXISTS "products_select" ON products;

CREATE POLICY "products_select" ON products
  FOR SELECT USING (true);

-- ============================================================================
-- 20260401000000_fix_save_product_is_active_sync.sql
-- ============================================================================

-- ============================================================================
-- FIX: Ensure is_active is always synced with status in save_product (7-param)
--
-- Root cause: The 7-parameter save_product (with p_option_groups) does NOT set
-- is_active on INSERT or UPDATE. The trigger only fires on UPDATE, so new
-- products created with status='inactive' or 'draft' still have is_active=true.
--
-- This migration:
-- 1. Recreates save_product (7-param) to explicitly set is_active
-- 2. Updates trigger to fire on INSERT as well
-- 3. One-time fix for any out-of-sync products
-- ============================================================================

-- 1. One-time data fix: sync ALL products
UPDATE products SET is_active = (status = 'active')
WHERE is_active != (status = 'active');

-- 2. Update trigger to fire on BOTH INSERT and UPDATE
CREATE OR REPLACE FUNCTION sync_product_is_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_is_active ON products;
CREATE TRIGGER trg_sync_product_is_active
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_is_active();

-- 3. Recreate 7-param save_product with is_active sync
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL,
  p_option_groups JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_metadata JSONB;
  v_option_values TEXT[];
  v_has_variants BOOLEAN;
  v_status product_status;
BEGIN
  -- Check if we have variants
  v_has_variants := p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0;

  -- Resolve status once
  v_status := COALESCE(p_product->>'status', 'draft')::product_status;

  -- Build metadata with option_groups
  v_metadata := COALESCE(p_option_groups, '[]'::jsonb);
  IF jsonb_array_length(v_metadata) > 0 THEN
    v_metadata := jsonb_build_object('option_groups', v_metadata);
  ELSE
    v_metadata := NULL;
  END IF;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, stock_quantity, status, is_active, brand_id, original_url, metadata)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE((p_product->>'stock_quantity')::INT, 0),
      v_status,
      (v_status = 'active'),
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', ''),
      v_metadata
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      stock_quantity = COALESCE((p_product->>'stock_quantity')::INT, 0),
      status = v_status,
      is_active = (v_status = 'active'),
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      -- Skip rich_description and rich_image types (handled separately)
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      -- Convert JSONB array to TEXT array
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    -- Remove rich description if not provided
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Reset all existing is_default to false before setting new one
  UPDATE product_variants SET is_default = false WHERE product_id = v_product_id;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    -- Convert option_values from JSONB array to TEXT array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_variant->'option_values', '[]'::jsonb))
    ) INTO v_option_values;

    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      -- Update existing variant
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        option_values = v_option_values,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      -- Insert new variant
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status, option_values)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status,
        v_option_values
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    -- Capture SKU from first variant (is_default = true or first in list)
    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    -- Sum up stock quantities
    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);

    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  -- Insert product-level images (from p_images)
  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Update products table with synced values
  -- If has variants: use variant SKU and sum of variant stock
  -- If no variants: keep the stock_quantity from p_product (already set above)
  IF v_has_variants THEN
    UPDATE products SET
      sku = v_first_variant_sku,
      stock_quantity = v_total_stock
    WHERE id = v_product_id;
  END IF;

  -- Insert variant-level images (embedded in each variant object)
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      -- Match by sku and name
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Also drop the 6-param version to avoid confusion (it's now redundant)
DROP FUNCTION IF EXISTS save_product(JSONB, JSONB, JSONB, UUID[], JSONB, JSONB);

SELECT 'Fixed: save_product now syncs is_active, trigger fires on INSERT+UPDATE, existing data synced' as message;

-- ============================================================================
-- 20260402000000_fix_order_items_variant_fk.sql
-- ============================================================================

-- ============================================================================
-- FIX: Change order_items.variant_id foreign key from RESTRICT to SET NULL
--
-- Problem: save_product deletes old variants not in the new list, but
-- order_items references them with ON DELETE RESTRICT, causing errors.
--
-- Solution: Change to ON DELETE SET NULL. Order items already store
-- variant_name and price as snapshots, so the order history is preserved.
-- ============================================================================

ALTER TABLE order_items
  DROP CONSTRAINT order_items_variant_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- ============================================================================
-- 20260402000000_orders_paid_at_trigger.sql
-- ============================================================================

-- ============================================================================
-- Ensure paid_at is always set when payment_status becomes 'paid'
-- 1. Trigger: auto-set paid_at on payment_status change
-- 2. Backfill: fix existing paid orders with NULL paid_at
-- ============================================================================

-- 1. Trigger function
CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_set_paid_at ON orders;
CREATE TRIGGER trg_set_paid_at
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_paid_at_on_payment();

-- 3. Backfill existing paid orders that have NULL paid_at
DO $$
BEGIN
  UPDATE orders
  SET paid_at = COALESCE(
    (SELECT pi.updated_at FROM payment_invoices pi WHERE pi.order_id = orders.id AND pi.status = 'paid' LIMIT 1),
    orders.created_at
  )
  WHERE payment_status = 'paid'
    AND paid_at IS NULL;
END;
$$;

-- ============================================================================
-- 20260403000000_transfer_orders_paid_at.sql
-- ============================================================================

-- ============================================================================
-- Update paid_at trigger to handle transfer orders:
-- - When payment_method = 'transfer' (unpaid): set paid_at = created_at
--   so transfer orders appear among paid orders in admin list
--   (sorted by paid_at DESC NULLS LAST)
-- - When payment_method changes away from 'transfer': clear paid_at
-- - When payment_status = 'paid': set paid_at = NOW() (existing behavior)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid: always set paid_at to NOW so order moves to top
  IF NEW.payment_status = 'paid' THEN
    NEW.paid_at := NOW();
  -- Transfer + unpaid: set paid_at = created_at so it appears among paid orders
  ELSIF NEW.payment_method = 'transfer' AND NEW.payment_status = 'unpaid' THEN
    NEW.paid_at := COALESCE(NEW.created_at, NOW());
  -- Changed from paid to non-paid (non-transfer): clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_status = 'paid'
    AND NEW.payment_status != 'paid'
    AND NEW.payment_method != 'transfer' THEN
    NEW.paid_at := NULL;
  -- Switching away from transfer while still unpaid: clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_method = 'transfer'
    AND NEW.payment_method != 'transfer'
    AND NEW.payment_status != 'paid' THEN
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill existing transfer orders that have NULL paid_at
UPDATE orders
SET paid_at = created_at
WHERE payment_method = 'transfer'
  AND payment_status = 'unpaid'
  AND paid_at IS NULL;

-- ============================================================================
-- 20260406000000_products_rls_active_only.sql
-- ============================================================================

-- ============================================================================
-- Restrict products RLS: anon can only see active products
--
-- Previously: USING (true) — allowed anyone to read ALL products.
-- Now:
--   anon:          USING (is_active = true)
--   authenticated: USING (true) — needed for order detail joins
--                  (order_items → products) where products may be deactivated
--
-- Application-level queries already filter .eq("is_active", true) everywhere,
-- but this adds defense-in-depth at the database level.
-- ============================================================================

-- 1. One-time data sync: ensure is_active matches status
UPDATE products SET is_active = (status = 'active')
WHERE is_active != (status = 'active');

-- 2. Replace the permissive policy with role-based policies
DROP POLICY IF EXISTS "products_select" ON products;

-- Anonymous users: only active products
CREATE POLICY "products_select_anon" ON products
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated users: all products (needed for order history product joins)
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 20260406000001_restore_order_stock.sql
-- ============================================================================

-- ============================================================================
-- Add stock restoration for cancelled/failed orders
--
-- Previously, when an order was cancelled or payment failed, stock was
-- never restored. This creates a restore_order_stock() function that
-- reverses the decrement_order_stock() operation.
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item record;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.variant_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = p_order_id
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            -- Variant product: restore variant stock
            UPDATE product_variants
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.variant_id;

            -- Sync parent product stock = SUM of all active variant stocks
            UPDATE products
            SET stock_quantity = COALESCE(
                (SELECT SUM(pv.stock_quantity)
                 FROM product_variants pv
                 WHERE pv.product_id = v_item.product_id
                   AND pv.status = 'active'),
                0
            )
            WHERE id = v_item.product_id;
        ELSE
            -- Simple product (no variant): restore product stock directly
            UPDATE products
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;
END;
$$;

-- ============================================================================
-- 20260406000002_sync_product_price_from_default_variant.sql
-- ============================================================================

-- ============================================================================
-- Sync product price/discount_price from default variant
--
-- Previously, products.price and products.discount_price were independent of
-- variant prices. This caused admin list filters/sorts on price to not reflect
-- the actual selling price (which comes from the default variant).
--
-- This migration updates save_product to sync price/discount from the default
-- variant (or first active variant) after saving variants.
-- Also does a one-time sync for existing products.
-- ============================================================================

-- 1. One-time sync: update product price/discount from default variant
UPDATE products p
SET
  price = COALESCE(dv.price, p.price),
  discount_price = dv.discount_price
FROM (
  SELECT DISTINCT ON (pv.product_id)
    pv.product_id,
    pv.price,
    pv.discount_price
  FROM product_variants pv
  WHERE pv.status = 'active'
  ORDER BY pv.product_id, pv.is_default DESC, pv.created_at ASC
) dv
WHERE p.id = dv.product_id;

-- 2. Update save_product to sync price/discount from default variant
CREATE OR REPLACE FUNCTION save_product(
  p_product JSONB,
  p_variants JSONB,
  p_images JSONB,
  p_category_ids UUID[],
  p_details JSONB DEFAULT NULL,
  p_rich_description JSONB DEFAULT NULL,
  p_option_groups JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := '{}';
  v_image JSONB;
  v_detail JSONB;
  v_sort INT;
  v_cat_id UUID;
  v_first_variant_sku VARCHAR;
  v_total_stock INT := 0;
  v_metadata JSONB;
  v_option_values TEXT[];
  v_has_variants BOOLEAN;
  v_status product_status;
  v_default_price NUMERIC;
  v_default_discount NUMERIC;
BEGIN
  -- Check if we have variants
  v_has_variants := p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0;

  -- Resolve status once
  v_status := COALESCE(p_product->>'status', 'draft')::product_status;

  -- Build metadata with option_groups
  v_metadata := COALESCE(p_option_groups, '[]'::jsonb);
  IF jsonb_array_length(v_metadata) > 0 THEN
    v_metadata := jsonb_build_object('option_groups', v_metadata);
  ELSE
    v_metadata := NULL;
  END IF;

  -- Upsert product
  IF (p_product->>'id') IS NULL OR (p_product->>'id') = '' THEN
    INSERT INTO products (name, slug, description, price, discount_price, stock_quantity, status, is_active, brand_id, original_url, metadata)
    VALUES (
      p_product->>'name',
      p_product->>'slug',
      p_product->>'description',
      (p_product->>'price')::NUMERIC,
      NULLIF(p_product->>'discount_price', '')::NUMERIC,
      COALESCE((p_product->>'stock_quantity')::INT, 0),
      v_status,
      (v_status = 'active'),
      NULLIF(p_product->>'brand_id', '')::UUID,
      NULLIF(p_product->>'original_url', ''),
      v_metadata
    )
    RETURNING id INTO v_product_id;
  ELSE
    v_product_id := (p_product->>'id')::UUID;
    UPDATE products SET
      name = p_product->>'name',
      slug = p_product->>'slug',
      description = p_product->>'description',
      price = (p_product->>'price')::NUMERIC,
      discount_price = NULLIF(p_product->>'discount_price', '')::NUMERIC,
      stock_quantity = COALESCE((p_product->>'stock_quantity')::INT, 0),
      status = v_status,
      is_active = (v_status = 'active'),
      brand_id = NULLIF(p_product->>'brand_id', '')::UUID,
      original_url = NULLIF(p_product->>'original_url', ''),
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  -- Save product details (Нэмэлт мэдээлэл - NOT rich description)
  DELETE FROM product_details WHERE product_id = v_product_id;
  v_sort := 0;
  IF p_details IS NOT NULL AND jsonb_array_length(p_details) > 0 THEN
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
      IF (v_detail->>'type') NOT IN ('rich_description', 'rich_image')
         AND COALESCE(v_detail->>'type', '') != ''
         AND COALESCE(TRIM(v_detail->>'content'), '') != '' THEN
        INSERT INTO product_details (product_id, type, content, sort_order)
        VALUES (v_product_id, v_detail->>'type', TRIM(v_detail->>'content'), v_sort);
        v_sort := v_sort + 1;
      END IF;
    END LOOP;
  END IF;

  -- Save rich description (Дэлгэрэнгүй тайлбар)
  IF p_rich_description IS NOT NULL THEN
    DECLARE
      v_rich_images TEXT[];
    BEGIN
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_rich_description->'images', '[]'::jsonb))
      ) INTO v_rich_images;

      INSERT INTO product_rich_descriptions (product_id, content, images)
      VALUES (
        v_product_id,
        NULLIF(TRIM(p_rich_description->>'content'), ''),
        COALESCE(v_rich_images, '{}')
      )
      ON CONFLICT (product_id) DO UPDATE SET
        content = NULLIF(TRIM(p_rich_description->>'content'), ''),
        images = COALESCE(v_rich_images, '{}'),
        updated_at = NOW();
    END;
  ELSE
    DELETE FROM product_rich_descriptions WHERE product_id = v_product_id;
  END IF;

  -- Reset all existing is_default to false before setting new one
  UPDATE product_variants SET is_default = false WHERE product_id = v_product_id;

  -- Upsert variants and calculate total stock
  v_sort := 0;
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_variant->'option_values', '[]'::jsonb))
    ) INTO v_option_values;

    IF (v_variant->>'id') IS NOT NULL
       AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID) THEN
      v_variant_id := (v_variant->>'id')::UUID;
      UPDATE product_variants SET
        sku = NULLIF(v_variant->>'sku', ''),
        name = NULLIF(v_variant->>'name', ''),
        price = (v_variant->>'price')::NUMERIC,
        discount_price = NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        stock_quantity = COALESCE((v_variant->>'stock_quantity')::INT, 0),
        is_default = COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        status = COALESCE(v_variant->>'status', 'active')::product_status,
        option_values = v_option_values,
        updated_at = NOW()
      WHERE id = v_variant_id;
    ELSE
      INSERT INTO product_variants (product_id, sku, name, price, discount_price, stock_quantity, is_default, status, option_values)
      VALUES (
        v_product_id,
        NULLIF(v_variant->>'sku', ''),
        NULLIF(v_variant->>'name', ''),
        (v_variant->>'price')::NUMERIC,
        NULLIF(v_variant->>'discount_price', '')::NUMERIC,
        COALESCE((v_variant->>'stock_quantity')::INT, 0),
        COALESCE((v_variant->>'is_default')::BOOLEAN, false),
        COALESCE(v_variant->>'status', 'active')::product_status,
        v_option_values
      )
      RETURNING id INTO v_variant_id;
    END IF;

    v_variant_ids := v_variant_ids || v_variant_id;

    IF v_sort = 0 OR (v_variant->>'is_default')::BOOLEAN = true THEN
      v_first_variant_sku := NULLIF(v_variant->>'sku', '');
    END IF;

    v_total_stock := v_total_stock + COALESCE((v_variant->>'stock_quantity')::INT, 0);
    v_sort := v_sort + 1;
  END LOOP;

  -- Delete variants not in the new list
  DELETE FROM product_variants
  WHERE product_id = v_product_id
    AND id != ALL(v_variant_ids);

  -- Replace all product images
  DELETE FROM product_images WHERE product_id = v_product_id;

  v_sort := 0;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (v_product_id, v_image->>'url', v_sort = 0, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  -- Sync product fields from variants
  IF v_has_variants THEN
    -- Get default variant's price/discount (is_default first, then first active)
    SELECT pv.price, pv.discount_price
    INTO v_default_price, v_default_discount
    FROM product_variants pv
    WHERE pv.product_id = v_product_id
      AND pv.status = 'active'
      AND pv.id = ANY(v_variant_ids)
    ORDER BY pv.is_default DESC
    LIMIT 1;

    UPDATE products SET
      sku = v_first_variant_sku,
      stock_quantity = v_total_stock,
      price = COALESCE(v_default_price, (p_product->>'price')::NUMERIC),
      discount_price = v_default_discount
    WHERE id = v_product_id;
  END IF;

  -- Insert variant-level images
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_variant_id := NULL;
    IF (v_variant->>'id') IS NOT NULL AND (v_variant->>'id') != ''
       AND EXISTS (SELECT 1 FROM product_variants WHERE id = (v_variant->>'id')::UUID AND product_id = v_product_id) THEN
      v_variant_id := (v_variant->>'id')::UUID;
    ELSE
      SELECT pv.id INTO v_variant_id
      FROM product_variants pv
      WHERE pv.product_id = v_product_id
        AND pv.id = ANY(v_variant_ids)
        AND COALESCE(pv.sku, '') = COALESCE(NULLIF(v_variant->>'sku', ''), '')
        AND COALESCE(pv.name, '') = COALESCE(NULLIF(v_variant->>'name', ''), '')
      LIMIT 1;
    END IF;

    IF v_variant_id IS NOT NULL AND v_variant->'images' IS NOT NULL AND jsonb_array_length(v_variant->'images') > 0 THEN
      v_sort := 0;
      FOR v_image IN SELECT * FROM jsonb_array_elements(v_variant->'images')
      LOOP
        INSERT INTO product_images (product_id, variant_id, url, is_primary, sort_order)
        VALUES (v_product_id, v_variant_id, v_image->>'url', false, v_sort);
        v_sort := v_sort + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Replace product_categories
  DELETE FROM product_categories WHERE product_id = v_product_id;
  IF p_category_ids IS NOT NULL THEN
    FOREACH v_cat_id IN ARRAY p_category_ids
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Drop the old 6-param version
DROP FUNCTION IF EXISTS save_product(JSONB, JSONB, JSONB, UUID[], JSONB, JSONB);

-- ============================================================================
-- 20260406100000_fix_all_timestamps_to_timestamptz.sql
-- ============================================================================

-- ============================================================================
-- Fix ALL remaining TIMESTAMP columns to TIMESTAMPTZ
--
-- Migration 00063 fixed orders + admin_notifications. This migration
-- completes the job for every other table.
--
-- PostgreSQL treats existing TIMESTAMP values as session timezone (UTC on
-- Supabase), so `USING col AT TIME ZONE 'UTC'` is a safe no-op conversion.
-- After this, Supabase returns timestamps with +00:00 suffix and JavaScript
-- parses them correctly as UTC.
--
-- Tables/columns that are already TIMESTAMPTZ are skipped (no-op if re-run).
-- Tables that may not exist are wrapped in exception handlers.
-- RLS policies referencing date columns are dropped and recreated.
-- ============================================================================

-- users
ALTER TABLE users
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- products
ALTER TABLE products
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- product_variants
ALTER TABLE product_variants
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- product_images
ALTER TABLE product_images
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- product_attributes
ALTER TABLE product_attributes
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- product_attribute_values
ALTER TABLE product_attribute_values
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- categories
ALTER TABLE categories
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- wishlists
ALTER TABLE wishlists
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- reviews
ALTER TABLE reviews
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- payments
ALTER TABLE payments
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- notifications
ALTER TABLE notifications
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- addresses
ALTER TABLE addresses
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- articles
ALTER TABLE articles
  ALTER COLUMN published_at TYPE TIMESTAMPTZ USING published_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- events
ALTER TABLE events
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date AT TIME ZONE 'UTC',
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- admins
ALTER TABLE admins
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- bank_accounts
ALTER TABLE bank_accounts
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- banners (start_date/end_date were dropped in earlier migrations)
ALTER TABLE banners
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- coupons (drop/recreate RLS policy that references start_date/end_date)
DROP POLICY IF EXISTS "coupons_select_active" ON coupons;

ALTER TABLE coupons
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date AT TIME ZONE 'UTC',
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

CREATE POLICY "coupons_select_active" ON coupons
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- branches
ALTER TABLE branches
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- ads (drop/recreate RLS policy that references start_date/end_date)
DROP POLICY IF EXISTS "ads_select_active" ON ads;

ALTER TABLE ads
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date AT TIME ZONE 'UTC',
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

CREATE POLICY "ads_select_active" ON ads
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- about_sections
ALTER TABLE about_sections
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- team_members
ALTER TABLE team_members
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- sms_campaigns
ALTER TABLE sms_campaigns
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- sms_logs
ALTER TABLE sms_logs
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- stock_history
ALTER TABLE stock_history
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- settings
ALTER TABLE settings
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- delivery_zones
ALTER TABLE delivery_zones
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- coupon_usages (column is used_at, not created_at)
ALTER TABLE coupon_usages
  ALTER COLUMN used_at TYPE TIMESTAMPTZ USING used_at AT TIME ZONE 'UTC';

-- Tables that may or may not exist in the live database
DO $$ BEGIN
  ALTER TABLE auth_sessions
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE policies
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE social_links
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE faqs
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE warehouses
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE warehouse_inventory
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- ============================================================================
-- 20260406210000_user_notes_and_stats_rpc.sql
-- ============================================================================

-- User notes table: skip if already exists
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);

-- RPC: get users with computed stats (point_balance, order_count, total_spent)
-- Supports server-side filtering and sorting by all fields
CREATE OR REPLACE FUNCTION get_users_with_stats(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_created_from TIMESTAMPTZ DEFAULT NULL,
  p_created_to TIMESTAMPTZ DEFAULT NULL,
  p_point_min BIGINT DEFAULT NULL,
  p_point_max BIGINT DEFAULT NULL,
  p_order_count_min BIGINT DEFAULT NULL,
  p_order_count_max BIGINT DEFAULT NULL,
  p_total_spent_min NUMERIC DEFAULT NULL,
  p_total_spent_max NUMERIC DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  primary_phone TEXT,
  avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  point_balance BIGINT,
  order_count BIGINT,
  total_spent NUMERIC,
  total_count BIGINT
) AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      u.id AS uid,
      COALESCE(pt_agg.balance, 0)::BIGINT AS point_balance,
      COALESCE(o_agg.order_count, 0)::BIGINT AS order_count,
      COALESCE(o_agg.total_spent, 0)::NUMERIC AS total_spent
    FROM users u
    LEFT JOIN (
      SELECT pt.user_id, SUM(pt.amount)::BIGINT AS balance
      FROM point_transactions pt
      GROUP BY pt.user_id
    ) pt_agg ON pt_agg.user_id = u.id
    LEFT JOIN (
      SELECT o.user_id,
             COUNT(*)::BIGINT AS order_count,
             SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END)::NUMERIC AS total_spent
      FROM orders o
      GROUP BY o.user_id
    ) o_agg ON o_agg.user_id = u.id
  ),
  filtered AS (
    SELECT
      u.id, u.email, u.first_name, u.last_name, u.primary_phone,
      u.avatar_url, u.status::TEXT, u.created_at,
      us.point_balance, us.order_count, us.total_spent
    FROM users u
    JOIN user_stats us ON us.uid = u.id
    WHERE
      (p_status IS NULL OR u.status::TEXT = p_status)
      AND (p_search IS NULL OR (
        u.first_name ILIKE '%' || p_search || '%'
        OR u.last_name ILIKE '%' || p_search || '%'
        OR u.email ILIKE '%' || p_search || '%'
        OR u.primary_phone ILIKE '%' || p_search || '%'
      ))
      AND (p_created_from IS NULL OR u.created_at >= p_created_from)
      AND (p_created_to IS NULL OR u.created_at <= p_created_to + INTERVAL '1 day')
      AND (p_point_min IS NULL OR us.point_balance >= p_point_min)
      AND (p_point_max IS NULL OR us.point_balance <= p_point_max)
      AND (p_order_count_min IS NULL OR us.order_count >= p_order_count_min)
      AND (p_order_count_max IS NULL OR us.order_count <= p_order_count_max)
      AND (p_total_spent_min IS NULL OR us.total_spent >= p_total_spent_min)
      AND (p_total_spent_max IS NULL OR us.total_spent <= p_total_spent_max)
  )
  SELECT
    f.id, f.email, f.first_name, f.last_name, f.primary_phone,
    f.avatar_url, f.status, f.created_at,
    f.point_balance, f.order_count, f.total_spent,
    COUNT(*) OVER()::BIGINT AS total_count
  FROM filtered f
  ORDER BY
    CASE p_sort
      WHEN 'newest' THEN -EXTRACT(EPOCH FROM f.created_at)::NUMERIC
      WHEN 'oldest' THEN EXTRACT(EPOCH FROM f.created_at)::NUMERIC
      WHEN 'most_orders' THEN -f.order_count::NUMERIC
      WHEN 'highest_points' THEN -f.point_balance::NUMERIC
      WHEN 'highest_spent' THEN -f.total_spent::NUMERIC
      ELSE -EXTRACT(EPOCH FROM f.created_at)::NUMERIC
    END ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 20260406300000_order_print_statuses.sql
-- ============================================================================

-- Add separate print status columns for 3 print workflows
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_products_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_box_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_downloaded BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 20260407000000_analytics_rpcs.sql
-- ============================================================================

-- ============================================================================
-- Analytics RPC functions for the revamped analytics page
-- ============================================================================

-- 1. Order Heatmap: day-of-week × hour-of-day order counts
CREATE OR REPLACE FUNCTION get_order_heatmap(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  day_of_week int,
  hour_of_day int,
  order_count bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    (EXTRACT(ISODOW FROM created_at AT TIME ZONE 'Asia/Ulaanbaatar')::int - 1) AS day_of_week,
    EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ulaanbaatar')::int AS hour_of_day,
    COUNT(*)::bigint AS order_count
  FROM orders
  WHERE status != 'canceled'
    AND (p_date_from IS NULL OR created_at >= p_date_from)
    AND (p_date_to IS NULL OR created_at < p_date_to)
  GROUP BY day_of_week, hour_of_day
  ORDER BY day_of_week, hour_of_day;
$$;

-- 2. Returning vs New Users: users who ordered in current period
CREATE OR REPLACE FUNCTION get_returning_vs_new_users(
  p_date_from timestamptz,
  p_date_to timestamptz
)
RETURNS TABLE(
  new_buyers bigint,
  returning_buyers bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH current_orderers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE status != 'canceled'
      AND created_at >= p_date_from
      AND created_at < p_date_to
  ),
  prev_orderers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE status != 'canceled'
      AND created_at < p_date_from
  )
  SELECT
    COUNT(*) FILTER (WHERE co.user_id NOT IN (SELECT user_id FROM prev_orderers))::bigint AS new_buyers,
    COUNT(*) FILTER (WHERE co.user_id IN (SELECT user_id FROM prev_orderers))::bigint AS returning_buyers
  FROM current_orderers co;
$$;

-- 3. Top Spenders: users ranked by total spending
CREATE OR REPLACE FUNCTION get_top_spenders(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  primary_phone text,
  total_spent numeric,
  order_count bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    u.id AS user_id,
    u.first_name::text,
    u.last_name::text,
    u.email::text,
    u.primary_phone::text,
    COALESCE(SUM(o.total_amount), 0)::numeric AS total_spent,
    COUNT(o.id)::bigint AS order_count
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status != 'canceled'
    AND o.payment_status = 'paid'
    AND (p_date_from IS NULL OR o.created_at >= p_date_from)
    AND (p_date_to IS NULL OR o.created_at < p_date_to)
  GROUP BY u.id, u.first_name, u.last_name, u.email, u.primary_phone
  ORDER BY total_spent DESC
  LIMIT p_limit;
$$;

-- 4. Coupon Analytics: aggregated coupon usage data
CREATE OR REPLACE FUNCTION get_coupon_analytics(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_usages bigint,
  total_discount numeric,
  top_coupons jsonb,
  usage_by_day jsonb
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_total_usages bigint;
  v_total_discount numeric;
  v_top_coupons jsonb;
  v_usage_by_day jsonb;
BEGIN
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(cu.discount_amount), 0)::numeric
  INTO v_total_usages, v_total_discount
  FROM coupon_usages cu
  WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
    AND (p_date_to IS NULL OR cu.used_at < p_date_to);

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_coupons
  FROM (
    SELECT
      c.code,
      c.type::text AS type,
      COUNT(cu.id)::bigint AS usage_count,
      COALESCE(SUM(cu.discount_amount), 0)::numeric AS total_discount
    FROM coupon_usages cu
    INNER JOIN coupons c ON c.id = cu.coupon_id
    WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
      AND (p_date_to IS NULL OR cu.used_at < p_date_to)
    GROUP BY c.id, c.code, c.type
    ORDER BY usage_count DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_usage_by_day
  FROM (
    SELECT
      (cu.used_at AT TIME ZONE 'Asia/Ulaanbaatar')::date::text AS date,
      COUNT(*)::bigint AS count
    FROM coupon_usages cu
    WHERE (p_date_from IS NULL OR cu.used_at >= p_date_from)
      AND (p_date_to IS NULL OR cu.used_at < p_date_to)
    GROUP BY (cu.used_at AT TIME ZONE 'Asia/Ulaanbaatar')::date
    ORDER BY date
  ) t;

  RETURN QUERY SELECT v_total_usages, v_total_discount, v_top_coupons, v_usage_by_day;
END;
$$;

-- ============================================================================
-- 20260407000000_dashboard_rpc_functions.sql
-- ============================================================================

-- ============================================================================
-- Dashboard RPC functions for server-side aggregation
--
-- Replaces client-side batched pagination (30+ sequential queries)
-- with 3 single SQL queries that aggregate in Postgres.
-- ============================================================================

-- 1. Total revenue from paid, non-canceled orders
CREATE OR REPLACE FUNCTION get_total_revenue(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM orders
  WHERE payment_status = 'paid'
    AND status != 'canceled'
    AND (p_from IS NULL OR created_at >= p_from)
    AND (p_to   IS NULL OR created_at < p_to);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Revenue grouped by day (in UB timezone)
CREATE OR REPLACE FUNCTION get_revenue_by_day(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ
)
RETURNS TABLE(day DATE, revenue NUMERIC) AS $$
  SELECT
    (created_at AT TIME ZONE 'Asia/Ulaanbaatar')::date AS day,
    SUM(total_amount) AS revenue
  FROM orders
  WHERE payment_status = 'paid'
    AND status != 'canceled'
    AND created_at >= p_from
    AND created_at < p_to
  GROUP BY day
  ORDER BY day;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Top selling products by quantity
CREATE OR REPLACE FUNCTION get_top_selling_products(
  p_from  TIMESTAMPTZ DEFAULT NULL,
  p_to    TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  product_id  UUID,
  product_name TEXT,
  units_sold  BIGINT,
  revenue     NUMERIC
) AS $$
  SELECT
    oi.product_id,
    p.name AS product_name,
    SUM(oi.quantity)::BIGINT AS units_sold,
    SUM(oi.quantity * oi.price) AS revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.payment_status = 'paid'
    AND o.status != 'canceled'
    AND (p_from IS NULL OR o.created_at >= p_from)
    AND (p_to   IS NULL OR o.created_at < p_to)
  GROUP BY oi.product_id, p.name
  ORDER BY units_sold DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grant access to service_role (used by admin API)
GRANT EXECUTE ON FUNCTION get_total_revenue TO service_role;
GRANT EXECUTE ON FUNCTION get_revenue_by_day TO service_role;
GRANT EXECUTE ON FUNCTION get_top_selling_products TO service_role;

-- ============================================================================
-- 20260407100000_fix_best_selling_timestamptz.sql
-- ============================================================================

-- Fix get_best_selling_products RPC to use TIMESTAMPTZ
-- After migration 20260406100000 changed all timestamp columns to timestamptz,
-- the function return type must match to avoid type mismatch errors.

DROP FUNCTION IF EXISTS get_best_selling_products(int, int);

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_period_days int DEFAULT 7,
  p_limit int DEFAULT 40
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  discount_price numeric,
  sku text,
  barcode text,
  stock_quantity int,
  is_active boolean,
  is_featured boolean,
  brand_id uuid,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  images text[],
  category_id uuid,
  total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  start_date timestamptz := now() - (p_period_days || ' days')::interval;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT
      oi.product_id,
      SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= start_date
      AND o.status != 'canceled'
    GROUP BY oi.product_id
  )
  SELECT
    p.id,
    p.name::text,
    p.slug::text,
    p.description::text,
    p.price,
    p.discount_price,
    p.sku::text,
    p.barcode::text,
    p.stock_quantity,
    p.is_active,
    p.is_featured,
    p.brand_id,
    p.metadata,
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order)
       FROM product_images pi
       WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
      '{}'::text[]
    ) AS images,
    (SELECT pc.category_id FROM product_categories pc WHERE pc.product_id = p.id LIMIT 1) AS category_id,
    COALESCE(s.total_sold, 0::bigint) AS total_sold
  FROM products p
  INNER JOIN sales s ON s.product_id = p.id
  WHERE p.is_active = true
    AND s.total_sold > 0
    AND p.stock_quantity > 0
  ORDER BY s.total_sold DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO anon;
GRANT EXECUTE ON FUNCTION get_best_selling_products(int, int) TO authenticated;

-- ============================================================================
-- 20260407100000_payment_logs.sql
-- ============================================================================

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

-- ============================================================================
-- 20260407200000_auto_deliver_shipped_orders.sql
-- ============================================================================

-- Auto-transition delivery_status from 'shipped' to 'delivered' after 24 hours.
-- Relies on order_status_history to determine when the order was shipped.
-- Existing triggers handle: history logging (record_order_status_change)
-- and push notifications (send_push_on_status_change).

CREATE OR REPLACE FUNCTION auto_deliver_shipped_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET delivery_status = 'delivered',
      updated_at = NOW()
  WHERE delivery_status = 'shipped'
    AND id IN (
      SELECT DISTINCT osh.order_id
      FROM order_status_history osh
      WHERE osh.status_type = 'delivery'
        AND osh.new_status = 'shipped'
        AND osh.changed_at <= NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule: run every hour
SELECT cron.schedule(
  'auto-deliver-shipped-orders',
  '0 * * * *',
  $$ SELECT auto_deliver_shipped_orders(); $$
);

-- ============================================================================
-- 20260413000000_fix_user_must_exist.sql
-- ============================================================================

-- ============================================================================
-- FIX: "validation failed user must exist" on checkout
--
-- Problem: handle_new_user() trigger silently swallows errors, causing
-- auth.users rows to exist without corresponding public.users rows.
-- When these users try to place orders, the FK constraint
-- orders.user_id -> public.users(id) fails.
--
-- Solution:
-- 1. Fix handle_new_user() trigger to handle unique_violation properly
-- 2. Add ensure_public_user() RPC as a safety net before order creation
-- 3. Update create_order_from_invoice() to call ensure_public_user()
-- 4. One-time sync of orphaned auth.users -> public.users
-- ============================================================================

-- 1. Fix handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;

  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2), '')
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    NEW.id,
    v_email,
    NULLIF(v_first_name, ''),
    NULLIF(v_last_name, ''),
    v_avatar_url,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email unique constraint violation: another public.users row has this email
    -- but with a different ID. First ensure the NEW user row exists, then update info.
    INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
    VALUES (
      NEW.id,
      NULL,  -- skip email to avoid unique violation again
      NULLIF(v_first_name, ''),
      NULLIF(v_last_name, ''),
      v_avatar_url,
      NEW.phone
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
      last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for user_id=%: % (SQLSTATE=%)', NEW.id, SQLERRM, SQLSTATE;
    -- Last resort: try a minimal insert so public.users row exists
    BEGIN
      INSERT INTO public.users (id) VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user fallback insert also failed for user_id=%: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ensure_public_user() RPC - safety net for application code
CREATE OR REPLACE FUNCTION ensure_public_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user record;
BEGIN
  -- Quick check: if user already exists, return immediately
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  -- Fetch from auth.users and insert into public.users
  SELECT id, email, phone, raw_user_meta_data
  INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user % not found', p_user_id;
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    v_auth_user.id,
    v_auth_user.email,
    NULLIF(COALESCE(
      v_auth_user.raw_user_meta_data->>'first_name',
      v_auth_user.raw_user_meta_data->>'given_name',
      SPLIT_PART(COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', ''), ' ', 1)
    ), ''),
    NULLIF(COALESCE(
      v_auth_user.raw_user_meta_data->>'last_name',
      v_auth_user.raw_user_meta_data->>'family_name',
      NULLIF(SPLIT_PART(COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', ''), ' ', 2), '')
    ), ''),
    COALESCE(
      v_auth_user.raw_user_meta_data->>'avatar_url',
      v_auth_user.raw_user_meta_data->>'picture'
    ),
    v_auth_user.phone
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 3. Update create_order_from_invoice() to call ensure_public_user() before order creation
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Ensure public.users row exists (safety net)
    PERFORM ensure_public_user(v_invoice.user_id);

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    v_address := v_invoice.pending_order_data->'address';

    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented, paid_at
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true, now()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    PERFORM decrement_order_stock(v_order_id);

    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. One-time sync: insert any orphaned auth.users into public.users
INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
SELECT
  au.id,
  au.email,
  NULLIF(COALESCE(
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1)
  ), ''),
  NULLIF(COALESCE(
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 2), '')
  ), ''),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20260416000000_fix_paid_at_reset.sql
-- ============================================================================

-- ============================================================================
-- Fix: paid_at was being reset to NOW() on every UPDATE to a paid order
-- (e.g. changing delivery_status, is_printed, etc.)
-- This caused orders to "shift" to today's date in the admin list.
--
-- Fix: Only set paid_at when it is NULL (first time becoming paid).
-- Transfer orders: only set paid_at = created_at when paid_at is NULL.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid: set paid_at only on first transition to paid (when paid_at is NULL)
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  -- Transfer + unpaid: set paid_at = created_at so it appears among paid orders
  ELSIF NEW.payment_method = 'transfer' AND NEW.payment_status = 'unpaid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := COALESCE(NEW.created_at, NOW());
  -- Changed from paid to non-paid (non-transfer): clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_status = 'paid'
    AND NEW.payment_status != 'paid'
    AND NEW.payment_method != 'transfer' THEN
    NEW.paid_at := NULL;
  -- Switching away from transfer while still unpaid: clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_method = 'transfer'
    AND NEW.payment_method != 'transfer'
    AND NEW.payment_status != 'paid' THEN
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Backfill: Restore corrupted paid_at values from payment_invoices and
-- order_status_history. The old trigger reset paid_at to NOW() on every
-- UPDATE, so we need to recover the original payment confirmation time.
-- ============================================================================

-- Temporarily disable the trigger so backfill UPDATEs don't re-fire it
ALTER TABLE orders DISABLE TRIGGER trg_set_paid_at;

-- 1. Best source: payment_invoices.updated_at (when invoice marked paid)
UPDATE orders o
SET paid_at = pi.updated_at
FROM payment_invoices pi
WHERE pi.order_id = o.id
  AND pi.status = 'paid'
  AND o.payment_status = 'paid';

-- 2. Fallback: order_status_history (when payment_status changed to paid)
UPDATE orders o
SET paid_at = osh.changed_at
FROM (
  SELECT DISTINCT ON (order_id) order_id, changed_at
  FROM order_status_history
  WHERE status_type = 'payment' AND new_status = 'paid'
  ORDER BY order_id, changed_at ASC
) osh
WHERE osh.order_id = o.id
  AND o.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM payment_invoices pi
    WHERE pi.order_id = o.id AND pi.status = 'paid'
  );

-- 3. Last resort: use created_at for paid orders with no payment records
UPDATE orders o
SET paid_at = o.created_at
WHERE o.payment_status = 'paid'
  AND o.paid_at IS NULL;

-- 4. Transfer orders: paid_at = created_at
UPDATE orders
SET paid_at = created_at
WHERE payment_method = 'transfer'
  AND payment_status = 'unpaid';

-- Re-enable the trigger
ALTER TABLE orders ENABLE TRIGGER trg_set_paid_at;

-- ============================================================================
-- 20260416100000_add_performance_indexes.sql
-- ============================================================================

-- Performance indexes for common admin queries

-- Orders: payment_status + created_at compound index (most common filter combination)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at
  ON orders (payment_status, created_at DESC);

-- Orders: user_id foreign key index (used in joins and user order lookups)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- Orders: payment_method filter
CREATE INDEX IF NOT EXISTS idx_orders_payment_method
  ON orders (payment_method);

-- Order items: order_id foreign key index (used in joins)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- Order items: product_id for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);

-- ============================================================================
-- 20260419000000_banners_mobile_storm_indexes.sql
-- ============================================================================

-- Supplements 20260416100000_add_performance_indexes.sql
-- Target: mobile launch on 2026-04-19 caused 131s banners query timeouts.
-- Uses CREATE INDEX to avoid blocking production writes.
-- Each statement runs outside a transaction (Supabase SQL Editor runs
-- each statement in its own implicit transaction).

-- 1) Banners: the 131s offender.
--    Partial composite on (type, sort_order) WHERE is_active = true
--    covers all 3 mobile home queries (carousel/promo/small) + web carousel.
CREATE INDEX IF NOT EXISTS idx_banners_active_type_sort
  ON banners (type, sort_order)
  WHERE is_active = true;

-- 2) Products list/home: is_active + created_at DESC.
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON products (created_at DESC)
  WHERE is_active = true;

-- 3) Category filtering via junction table.
--    products.category_id was dropped in 00030_remove_redundant_product_columns.sql.
CREATE INDEX IF NOT EXISTS idx_product_categories_category
  ON product_categories (category_id, product_id);

-- 4) Order history composite.
--    Existing idx_orders_user_id is single-column; composite wins for
--    ORDER BY created_at DESC paginated queries.
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- Note: admins.email is already UNIQUE NOT NULL → Postgres auto-creates
-- a btree index for the UNIQUE constraint, so idx_admins_email is redundant.

-- ============================================================================
-- 20260419100000_get_home_banners_rpc.sql
-- ============================================================================

-- Single RPC that returns all three banner types for the mobile home screen.
-- Reduces per-session DB roundtrips from 3 (carousel + promo + small) to 1
-- and bypasses per-row RLS evaluation via SECURITY DEFINER.
-- Intended for mobile use; web continues to use its SSR query.

CREATE OR REPLACE FUNCTION get_home_banners()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'carousel', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'carousel'
        ORDER BY sort_order
        LIMIT 10
      ) b
    ), '[]'::jsonb),
    'promo', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'promo'
        ORDER BY sort_order
      ) b
    ), '[]'::jsonb),
    'small', COALESCE((
      SELECT jsonb_agg(row_to_json(b)) FROM (
        SELECT * FROM banners
        WHERE is_active = true AND type = 'small'
        ORDER BY sort_order
      ) b
    ), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION get_home_banners() TO anon, authenticated;

-- ============================================================================
-- 20260419110000_ios_binary_schema_compat.sql
-- ============================================================================

-- iOS binary schema-compat hotfix for 2026-04-19 production outage.
--
-- The App Store iOS binary that went live this morning was built from an
-- older codebase commit and sends queries the current production schema
-- rejects, returning HTTP 400 from PostgREST in tight loops. That gateway
-- traffic saturated the PostgREST tier, preventing web/admin auth requests
-- from getting through, even after the banners-storm DB CPU issue was
-- resolved by 20260419000000_banners_mobile_storm_indexes.sql.
--
-- All four patches below are purely additive — no existing reader breaks,
-- no data is moved, no table is rewritten.
--
-- IMPORTANT: The ALTER TYPE ... ADD VALUE statement cannot run inside a
-- transaction block. When applying via `supabase db push` (or any tool
-- that wraps the whole file in a BEGIN/COMMIT), split this file and run
-- the enum change separately, e.g.:
--
--   psql -c "ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'approved';"
--
-- then apply the rest of this file. Applied live on 2026-04-19 via
-- individual execute_sql calls.

-- 1) product_variants.description
--
-- Originally dropped in 00039_remove_unused_variant_columns.sql. The
-- deployed iOS binary still selects this column. Re-adding it as a
-- nullable, no-default column does not rewrite the table; mobile reads
-- NULL, which the binary's model tolerates.
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN product_variants.description IS
  'Nullable placeholder re-added on 2026-04-19 for iOS binary compat. '
  'Older mobile builds select this column; current local mobile code '
  'does not. Keep nullable until all clients are on a build that omits '
  'it, then drop again.';

-- 2) review_status enum: add 'approved'.
--
-- Must be run outside a transaction. See file-level IMPORTANT note above.
-- The deployed iOS binary filters reviews with status=eq.approved, but
-- the enum was defined in 00001_complete_schema.sql as ('active','hidden',
-- 'flagged'). Adding 'approved' is additive; no existing row uses it.
-- Mobile queries will return 0 rows (reviews feature effectively hidden
-- on the deployed binary) but stop 400-ing against PostgREST.
ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'approved';

-- 3) app_config: grant SELECT to anon.
--
-- The "Public read access" RLS policy on app_config already grants SELECT
-- to both anon and authenticated. But RLS policies sit on top of table-
-- level GRANTs: without GRANT SELECT to anon, PostgREST returns "permission
-- denied for table app_config" before the policy can run. Mobile reads
-- app_config on every launch for force-update checks, so this was a
-- high-volume 400 source.
GRANT SELECT ON TABLE app_config TO anon;

-- 4) search_logs: grant SELECT + INSERT to anon.
--
-- Same RLS-without-GRANT root cause as app_config. The existing policies
-- ("Anyone can log searches" for INSERT, "Allow public read access to
-- search_logs" for SELECT) already cover both operations for anon, but
-- table-level GRANTs were missing. Mobile inserts on every search (for
-- trending) and reads when displaying trending suggestions.
GRANT SELECT, INSERT ON TABLE search_logs TO anon;

-- ============================================================================
-- 20260419120000_atomic_coupon_and_point_helpers.sql
-- ============================================================================

-- Atomic helpers for admin order-edit flows.
--
-- Without these, two admins concurrently editing the same order racing the
-- coupon usage_count or refunding the same order can corrupt point balance
-- and coupon usage limits. The web client did the same operations with
-- read-modify-write SQL.
--
-- Each function is SECURITY DEFINER and idempotent — safe to call from
-- the admin API route which already authenticates the caller.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Atomic coupon usage_count delta
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.increment_coupon_usage(
  p_coupon_id uuid,
  p_delta int default 1
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  update coupons
  set usage_count = greatest(0, coalesce(usage_count, 0) + p_delta)
  where id = p_coupon_id
  returning usage_count into v_new_count;
  return coalesce(v_new_count, 0);
end;
$$;

revoke all on function public.increment_coupon_usage(uuid, int) from public;
grant execute on function public.increment_coupon_usage(uuid, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Refund order points + reverse coupon usage in a single transaction.
-- Idempotent — checks existing refund rows before inserting.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.refund_order_points_and_coupon(
  p_order_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing_refund_count int;
  v_used_count int := 0;
  v_earned_count int := 0;
  v_coupon_count int := 0;
  v_used_amount int;
  v_earned_amount int;
  v_balance int;
  v_total_to_refund int := 0;
begin
  select id, user_id, order_number into v_order
  from orders
  where id = p_order_id;

  if not found then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  -- Idempotency check
  select count(*) into v_existing_refund_count
  from point_transactions
  where order_id = p_order_id and type = 'refund';

  if v_existing_refund_count > 0 then
    return json_build_object('success', true, 'already_refunded', true);
  end if;

  -- Compute total points the user is *gaining* from the refund
  select coalesce(sum(amount), 0) into v_used_amount
  from point_transactions
  where order_id = p_order_id and type = 'used';

  select coalesce(sum(amount), 0) into v_earned_amount
  from point_transactions
  where order_id = p_order_id and type = 'earned';

  -- balance check: refund of `used` points adds back |used_amount|.
  -- Reversing earned points subtracts earned_amount. Net effect:
  -- delta = abs(used_amount) - earned_amount. Must not push balance < 0.
  v_total_to_refund := abs(v_used_amount) - v_earned_amount;

  if v_total_to_refund < 0 then
    -- We will be deducting from user balance. Verify they can afford it.
    select coalesce(sum(amount), 0) into v_balance
    from point_transactions
    where user_id = v_order.user_id;

    if v_balance + v_total_to_refund < 0 then
      return json_build_object(
        'success', false,
        'error', 'insufficient_balance',
        'current_balance', v_balance,
        'required', -v_total_to_refund
      );
    end if;
  end if;

  -- Refund used points (positive entries)
  insert into point_transactions (user_id, order_id, type, amount, description)
  select
    v_order.user_id,
    p_order_id,
    'refund',
    abs(amount),
    format('Захиалга #%s буцаалт', v_order.order_number)
  from point_transactions
  where order_id = p_order_id and type = 'used';
  get diagnostics v_used_count = row_count;

  -- Reverse earned points (negative entries)
  insert into point_transactions (user_id, order_id, type, amount, description)
  select
    v_order.user_id,
    p_order_id,
    'refund',
    -amount,
    format('Захиалга #%s буцаалт', v_order.order_number)
  from point_transactions
  where order_id = p_order_id and type = 'earned';
  get diagnostics v_earned_count = row_count;

  -- Reverse coupon usage atomically
  for v_used_amount in
    select cu.coupon_id
    from coupon_usages cu
    where cu.order_id = p_order_id
  loop
    perform public.increment_coupon_usage(v_used_amount::uuid, -1);
    v_coupon_count := v_coupon_count + 1;
  end loop;

  delete from coupon_usages where order_id = p_order_id;

  return json_build_object(
    'success', true,
    'refunded_used', v_used_count,
    'reversed_earned', v_earned_count,
    'reversed_coupons', v_coupon_count
  );
end;
$$;

revoke all on function public.refund_order_points_and_coupon(uuid) from public;
grant execute on function public.refund_order_points_and_coupon(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Record order points usage + earned + coupon usage in one transaction.
-- Idempotent on each insert — guards against duplicate row insertion.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.record_order_points_and_coupon(
  p_order_id uuid,
  p_points_used int,
  p_points_earned int,
  p_coupon_id uuid default null,
  p_coupon_discount numeric default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing int;
begin
  select id, user_id, order_number into v_order
  from orders
  where id = p_order_id;

  if not found then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if p_points_used > 0 then
    select count(*) into v_existing
    from point_transactions
    where order_id = p_order_id and type = 'used';

    if v_existing = 0 then
      insert into point_transactions
        (user_id, order_id, type, amount, description)
      values
        (v_order.user_id, p_order_id, 'used', -p_points_used,
         format('Захиалга #%s', v_order.order_number));
    end if;
  end if;

  if p_points_earned > 0 then
    select count(*) into v_existing
    from point_transactions
    where order_id = p_order_id and type = 'earned';

    if v_existing = 0 then
      insert into point_transactions
        (user_id, order_id, type, amount, description)
      values
        (v_order.user_id, p_order_id, 'earned', p_points_earned,
         format('Захиалга #%s', v_order.order_number));
    end if;
  end if;

  if p_coupon_id is not null and p_coupon_discount > 0 then
    select count(*) into v_existing
    from coupon_usages
    where order_id = p_order_id;

    if v_existing = 0 then
      insert into coupon_usages
        (coupon_id, user_id, order_id, discount_amount)
      values
        (p_coupon_id, v_order.user_id, p_order_id, p_coupon_discount);

      perform public.increment_coupon_usage(p_coupon_id, 1);
    end if;
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) from public;
grant execute on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) to service_role;

-- ============================================================================
-- 20260419130000_category_tree_product_ids_rpc.sql
-- ============================================================================

-- RPC that returns all distinct product IDs reachable from a category
-- tree (the slugged category + every descendant). Required because
-- passing ~700 UUIDs back through a PostgREST .in() filter blows the
-- CDN's 16KB URL limit and fails silently, leaving category pages
-- empty (observed on /products?category=make-up-566e).
--
-- Returns only active products. Sorted by product.id so callers can
-- page consistently and apply their own sort on the fetched rows.
create or replace function public.get_category_tree_product_ids(
  p_slug text
)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  with recursive tree as (
    select c.id
    from categories c
    where c.slug = p_slug and c.is_active = true
    union all
    select child.id
    from categories child
    join tree t on child.parent_id = t.id
    where child.is_active = true
  )
  select distinct p.id
  from products p
  join product_categories pc on pc.product_id = p.id
  where pc.category_id in (select id from tree)
    and p.is_active = true
  order by p.id; -- deterministic; final ordering happens in caller
$$;

revoke all on function public.get_category_tree_product_ids(text) from public;
grant execute on function public.get_category_tree_product_ids(text) to anon, authenticated, service_role;

-- ============================================================================
-- 20260419140000_get_products_by_category_tree_rpc.sql
-- ============================================================================

-- Paginated products-by-category-tree RPC. The frontend was
-- previously doing category-tree resolution + product-id filter
-- client-side, but when a category has more than ~300 descendant
-- products the resulting `.in("id", [...])` URL crosses the Vercel
-- 14KB request limit and silently 414's (observed on
-- /products?category=make-up-566e with 652 unique products). Moving
-- the whole filtered query server-side sidesteps the URL issue
-- entirely.
--
-- `total_count` is repeated on each row so the caller can derive the
-- paginated total without a second query.
create or replace function public.get_products_by_category_tree(
  p_slug text,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_in_stock boolean default null,
  p_sort text default 'newest',
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  is_featured boolean,
  stock_quantity int,
  category_id uuid,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limit int := greatest(1, least(coalesce(p_limit, 24), 100));
  v_offset int := greatest(0, coalesce(p_offset, 0));
begin
  return query
  with recursive tree as (
    select c.id
    from categories c
    where c.slug = p_slug and c.is_active = true
    union all
    select child.id
    from categories child
    join tree t on child.parent_id = t.id
    where child.is_active = true
  ),
  candidates as (
    select distinct p.id as product_id
    from products p
    join product_categories pc on pc.product_id = p.id
    where pc.category_id in (select tree.id from tree)
      and p.is_active = true
  ),
  filtered as (
    select
      p.id,
      p.name::text as name,
      p.slug::text as slug,
      p.price,
      p.discount_price,
      p.is_featured,
      p.stock_quantity,
      p.category_id,
      count(*) over () as total_count
    from products p
    join candidates ca on ca.product_id = p.id
    where
      (
        p_min_price is null
        or (case
          when p.discount_price is not null and p.discount_price > 0
            then p.discount_price >= p_min_price
          else p.price >= p_min_price
        end)
      )
      and (
        p_max_price is null
        or (case
          when p.discount_price is not null and p.discount_price > 0
            then p.discount_price <= p_max_price
          else p.price <= p_max_price
        end)
      )
      and (p_in_stock is null or p_in_stock = false or p.stock_quantity > 0)
  )
  select f.id, f.name, f.slug, f.price, f.discount_price,
         f.is_featured, f.stock_quantity, f.category_id, f.total_count
  from filtered f
  order by
    case when p_sort = 'price_asc'
      then coalesce(nullif(f.discount_price, 0), f.price) end asc nulls last,
    case when p_sort = 'price_desc'
      then coalesce(nullif(f.discount_price, 0), f.price) end desc nulls last,
    case when p_sort = 'popular' then f.stock_quantity end asc nulls last,
    case when p_sort = 'newest' or p_sort is null or p_sort not in ('price_asc','price_desc','popular')
      then f.id end asc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.get_products_by_category_tree(
  text, numeric, numeric, boolean, text, int, int
) from public;
grant execute on function public.get_products_by_category_tree(
  text, numeric, numeric, boolean, text, int, int
) to anon, authenticated, service_role;

-- ============================================================================
-- 20260419150000_stock_nonneg_check.sql
-- ============================================================================

-- Backstop: stock can never be negative. No current violators
-- (verified 2026-04-19: MIN(stock_quantity)=0 on both tables).
-- decrement_order_stock already floors at zero via GREATEST(0, …),
-- so this constraint formalises what the writer already guarantees
-- and rejects any future writer that forgets.
alter table public.products
  add constraint products_stock_quantity_nonneg
  check (stock_quantity >= 0);

alter table public.product_variants
  add constraint product_variants_stock_quantity_nonneg
  check (stock_quantity >= 0);

-- ============================================================================
-- 20260420000000_notifications_delete_policy.sql
-- ============================================================================

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

-- ============================================================================
-- 20260420000000_search_fuzzy_fallback.sql
-- ============================================================================

-- ============================================================================
-- Search: fuzzy fallback + spelling suggestion
-- ============================================================================
-- 1. search_products now auto-broadens to trigram matching when strict
--    all-words-match returns fewer than FUZZY_THRESHOLD (5) rows.
--    The returned table gains a `fuzzy_fallback` boolean column so callers
--    can render "showing similar results" hints.
-- 2. New get_spelling_suggestion(text) returns the closest product / brand
--    / category name (trigram similarity >= 0.3) for "Did you mean?" UI.
--
-- Backward compatibility:
--  - p_allow_fuzzy defaults to TRUE, so existing 8-arg callers behave
--    the same *until* their query has < 5 strict hits.
--  - The new fuzzy_fallback column is additive; JSON decoders that pick
--    specific keys (mobile Flutter, web TS) ignore unknown fields.
-- ============================================================================

-- Drop old 8-arg signature; we recreate as 9-arg (with p_allow_fuzzy).
DROP FUNCTION IF EXISTS search_products(text, text, numeric, numeric, boolean, text, integer, integer);

CREATE OR REPLACE FUNCTION search_products(
  p_search_query text,
  p_category_slug text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_in_stock boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_page_number int DEFAULT 1,
  p_page_size int DEFAULT 24,
  p_allow_fuzzy boolean DEFAULT true
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  images text[],
  is_featured boolean,
  stock_quantity int,
  category_name text,
  category_slug text,
  similarity real,
  total_count bigint,
  fuzzy_fallback boolean
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  offset_val int := (p_page_number - 1) * p_page_size;
  v_search_words text[];
  v_strict_count bigint;
  v_lower_query text := lower(trim(coalesce(p_search_query, '')));
  v_fuzzy_threshold constant int := 5;
  v_trgm_threshold constant real := 0.3;
  v_use_fuzzy boolean := false;
BEGIN
  -- Split search query into words (minimum 2 characters each, lowercased)
  SELECT array_agg(word) INTO v_search_words
  FROM (
    SELECT unnest(string_to_array(v_lower_query, ' ')) AS word
  ) t
  WHERE length(word) >= 2;

  -- Decide whether to broaden to fuzzy. Only consider fuzzy when:
  --   - caller opted in (p_allow_fuzzy = true)
  --   - query is non-trivial (>= 2 chars)
  --   - strict-match result set is thin
  IF p_allow_fuzzy AND length(v_lower_query) >= 2 THEN
    SELECT COUNT(DISTINCT p.id) INTO v_strict_count
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE p.is_active = true
      AND (
        check_all_words_match(p.name, v_search_words)
        OR check_all_words_match(coalesce(p.description, ''), v_search_words)
      )
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_min_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price >= p_min_price
          ELSE p.price >= p_min_price
        END)
      AND (p_max_price IS NULL OR
        CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
          THEN p.discount_price <= p_max_price
          ELSE p.price <= p_max_price
        END)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false);

    IF v_strict_count < v_fuzzy_threshold THEN
      v_use_fuzzy := true;
    END IF;
  END IF;

  IF v_use_fuzzy THEN
    -- Fuzzy branch: broaden with trigram word_similarity. Keep price/category/
    -- stock filters unchanged; only the name/description predicate is relaxed.
    RETURN QUERY
    WITH matched AS (
      SELECT
        p.id,
        p.name::text,
        p.slug::text,
        p.price,
        p.discount_price,
        COALESCE(
          (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
          '{}'::text[]
        ) AS images,
        p.is_featured,
        p.stock_quantity,
        c.name::text AS category_name,
        c.slug::text AS category_slug,
        greatest(
          similarity(lower(p.name), v_lower_query),
          word_similarity(v_lower_query, lower(p.name)),
          similarity(lower(coalesce(p.description, '')), v_lower_query) * 0.5
        )::real AS similarity,
        p.created_at
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_active = true
        AND (
          word_similarity(v_lower_query, lower(p.name)) >= v_trgm_threshold
          OR similarity(lower(p.name), v_lower_query) >= v_trgm_threshold
          OR word_similarity(v_lower_query, lower(coalesce(p.description, ''))) >= v_trgm_threshold
        )
        AND (p_category_slug IS NULL OR c.slug = p_category_slug)
        AND (p_min_price IS NULL OR
          CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
            THEN p.discount_price >= p_min_price
            ELSE p.price >= p_min_price
          END)
        AND (p_max_price IS NULL OR
          CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
            THEN p.discount_price <= p_max_price
            ELSE p.price <= p_max_price
          END)
        AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
    )
    SELECT
      m.id, m.name, m.slug, m.price, m.discount_price,
      m.images, m.is_featured, m.stock_quantity,
      m.category_name, m.category_slug, m.similarity,
      count(*) OVER() AS total_count,
      true AS fuzzy_fallback
    FROM (
      SELECT DISTINCT ON (matched.id) matched.* FROM matched
    ) m
    ORDER BY
      CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
      m.similarity DESC
    LIMIT p_page_size
    OFFSET offset_val;
  ELSE
    -- Strict branch: unchanged behaviour from migration 00067.
    RETURN QUERY
    WITH matched AS (
      SELECT
        p.id,
        p.name::text,
        p.slug::text,
        p.price,
        p.discount_price,
        COALESCE(
          (SELECT ARRAY_AGG(pi.url ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL),
          '{}'::text[]
        ) AS images,
        p.is_featured,
        p.stock_quantity,
        c.name::text AS category_name,
        c.slug::text AS category_slug,
        greatest(
          similarity(p.name, p_search_query),
          similarity(coalesce(p.description, ''), p_search_query) * 0.5
        )::real AS similarity,
        p.created_at
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_active = true
        AND (
          check_all_words_match(p.name, v_search_words)
          OR check_all_words_match(coalesce(p.description, ''), v_search_words)
        )
        AND (p_category_slug IS NULL OR c.slug = p_category_slug)
        AND (p_min_price IS NULL OR
          CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
            THEN p.discount_price >= p_min_price
            ELSE p.price >= p_min_price
          END)
        AND (p_max_price IS NULL OR
          CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
            THEN p.discount_price <= p_max_price
            ELSE p.price <= p_max_price
          END)
        AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock_quantity > 0) OR p_in_stock = false)
    )
    SELECT
      m.id, m.name, m.slug, m.price, m.discount_price,
      m.images, m.is_featured, m.stock_quantity,
      m.category_name, m.category_slug, m.similarity,
      count(*) OVER() AS total_count,
      false AS fuzzy_fallback
    FROM (
      SELECT DISTINCT ON (matched.id) matched.* FROM matched
    ) m
    ORDER BY
      CASE WHEN p_sort_by = 'relevance' THEN m.similarity END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC NULLS LAST,
      m.similarity DESC
    LIMIT p_page_size
    OFFSET offset_val;
  END IF;
END;
$$;

-- ============================================================================
-- Spelling suggestion: closest product / brand / category name by trigram
-- similarity. Powers the "Did you mean X?" banner on the search results page.
-- ============================================================================
DROP FUNCTION IF EXISTS get_spelling_suggestion(text);

CREATE OR REPLACE FUNCTION get_spelling_suggestion(p_query text)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_lower text := lower(trim(coalesce(p_query, '')));
  v_best text;
  v_threshold constant real := 0.3;
BEGIN
  IF length(v_lower) < 2 THEN
    RETURN NULL;
  END IF;

  SELECT candidate INTO v_best
  FROM (
    SELECT p.name::text AS candidate,
           greatest(
             similarity(lower(p.name), v_lower),
             word_similarity(v_lower, lower(p.name))
           )::real AS score
    FROM products p
    WHERE p.is_active = true AND lower(p.name) <> v_lower
    UNION ALL
    SELECT b.name::text AS candidate,
           greatest(
             similarity(lower(b.name), v_lower),
             word_similarity(v_lower, lower(b.name))
           )::real AS score
    FROM brands b
    WHERE lower(b.name) <> v_lower
    UNION ALL
    SELECT c.name::text AS candidate,
           greatest(
             similarity(lower(c.name), v_lower),
             word_similarity(v_lower, lower(c.name))
           )::real AS score
    FROM categories c
    WHERE c.is_active = true AND lower(c.name) <> v_lower
  ) s
  WHERE s.score >= v_threshold
  ORDER BY s.score DESC
  LIMIT 1;

  RETURN v_best;
END;
$$;

GRANT EXECUTE ON FUNCTION get_spelling_suggestion(text) TO anon, authenticated;

-- ============================================================================
-- 20260420120000_fix_atomic_helpers_record_var.sql
-- ============================================================================

-- 1. increment_coupon_usage
create or replace function public.increment_coupon_usage(
  p_coupon_id uuid,
  p_delta int default 1
)
returns int
language sql
security definer
set search_path = public
as $$
  update coupons
  set usage_count = greatest(0, coalesce(usage_count, 0) + p_delta)
  where id = p_coupon_id
  returning usage_count;
$$;

revoke all on function public.increment_coupon_usage(uuid, int) from public;
grant execute on function public.increment_coupon_usage(uuid, int) to service_role;


-- 2. record_order_points_and_coupon
create or replace function public.record_order_points_and_coupon(
  p_order_id uuid,
  p_points_used int,
  p_points_earned int,
  p_coupon_id uuid default null,
  p_coupon_discount numeric default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from orders where id = p_order_id) then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if p_points_used > 0 then
    insert into point_transactions (user_id, order_id, type, amount, description)
    select o.user_id, o.id, 'used', -p_points_used,
           format('Захиалга #%s', o.order_number)
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from point_transactions where order_id = p_order_id and type = 'used');
  end if;

  if p_points_earned > 0 then
    insert into point_transactions (user_id, order_id, type, amount, description)
    select o.user_id, o.id, 'earned', p_points_earned,
           format('Захиалга #%s', o.order_number)
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from point_transactions where order_id = p_order_id and type = 'earned');
  end if;

  if p_coupon_id is not null and p_coupon_discount > 0 then
    insert into coupon_usages (coupon_id, user_id, order_id, discount_amount)
    select p_coupon_id, o.user_id, o.id, p_coupon_discount
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from coupon_usages where order_id = p_order_id);

    if found then
      perform public.increment_coupon_usage(p_coupon_id, 1);
    end if;
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) from public;
grant execute on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) to service_role;


-- 3. refund_order_points_and_coupon
create or replace function public.refund_order_points_and_coupon(
  p_order_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used_amount int;
  v_earned_amount int;
  v_balance int;
  v_total_to_refund int;
  v_used_count int;
  v_earned_count int;
  v_coupon_count int := 0;
  v_cid uuid;
begin
  if not exists (select 1 from orders where id = p_order_id) then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if exists (select 1 from point_transactions where order_id = p_order_id and type = 'refund') then
    return json_build_object('success', true, 'already_refunded', true);
  end if;

  v_used_amount := (select coalesce(sum(amount), 0) from point_transactions where order_id = p_order_id and type = 'used');
  v_earned_amount := (select coalesce(sum(amount), 0) from point_transactions where order_id = p_order_id and type = 'earned');
  v_total_to_refund := abs(v_used_amount) - v_earned_amount;

  if v_total_to_refund < 0 then
    v_balance := (select coalesce(sum(pt.amount), 0) from point_transactions pt where pt.user_id = (select user_id from orders where id = p_order_id));

    if v_balance + v_total_to_refund < 0 then
      return json_build_object(
        'success', false,
        'error', 'insufficient_balance',
        'current_balance', v_balance,
        'required', -v_total_to_refund
      );
    end if;
  end if;

  v_used_count := (select count(*) from point_transactions where order_id = p_order_id and type = 'used');

  insert into point_transactions (user_id, order_id, type, amount, description)
  select o.user_id, p_order_id, 'refund', abs(pt.amount),
         format('Захиалга #%s буцаалт', o.order_number)
  from point_transactions pt
  join orders o on o.id = p_order_id
  where pt.order_id = p_order_id and pt.type = 'used';

  v_earned_count := (select count(*) from point_transactions where order_id = p_order_id and type = 'earned' and amount > 0);

  insert into point_transactions (user_id, order_id, type, amount, description)
  select o.user_id, p_order_id, 'refund', -pt.amount,
         format('Захиалга #%s буцаалт', o.order_number)
  from point_transactions pt
  join orders o on o.id = p_order_id
  where pt.order_id = p_order_id and pt.type = 'earned';

  for v_cid in select cu.coupon_id from coupon_usages cu where cu.order_id = p_order_id
  loop
    perform public.increment_coupon_usage(v_cid, -1);
    v_coupon_count := v_coupon_count + 1;
  end loop;

  delete from coupon_usages where order_id = p_order_id;

  return json_build_object(
    'success', true,
    'refunded_used', v_used_count,
    'reversed_earned', v_earned_count,
    'reversed_coupons', v_coupon_count
  );
end;
$$;

revoke all on function public.refund_order_points_and_coupon(uuid) from public;
grant execute on function public.refund_order_points_and_coupon(uuid) to service_role;

-- ============================================================================
-- 20260421000000_admin_otp_login.sql
-- ============================================================================

-- ============================================================================
-- Admin OTP Login: password_hash устгах, 2FA toggle нэмэх, нэмэлт имэйл хүснэгт
-- ============================================================================

-- 1. admins хүснэгтээс password_hash устгах (OTP-руу шилжсэн)
ALTER TABLE admins DROP COLUMN IF EXISTS password_hash;

-- 2. 2FA toggle нэмэх
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- 3. Нэмэлт нэвтрэх имэйл хаягийн хүснэгт
CREATE TABLE IF NOT EXISTS admin_login_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_admin_login_emails_admin_id
    ON admin_login_emails(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_login_emails_email_verified
    ON admin_login_emails(email) WHERE is_verified = TRUE;

-- RLS
ALTER TABLE admin_login_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_login_emails"
    ON admin_login_emails FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================================
-- 20260421100000_update_order_payment_method_rpc.sql
-- ============================================================================

-- RPC function for updating order payment_method (qpay <-> transfer)
-- Used by mobile app since RLS doesn't allow direct UPDATE on orders table.

CREATE OR REPLACE FUNCTION update_order_payment_method(
  p_order_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate payment_method value
  IF p_payment_method NOT IN ('qpay', 'transfer') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', p_payment_method;
  END IF;

  -- Only allow the order owner to update, and only unpaid orders
  UPDATE orders
  SET
    payment_method = p_payment_method::payment_method,
    updated_at = now()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND payment_status = 'unpaid';
END;
$$;

-- ============================================================================
-- 20260430000000_create_free_order_rpc.sql
-- ============================================================================

-- ============================================================================
-- create_free_order RPC: handles 0-MNT purchases (fully covered by points/coupons)
--
-- Mirrors web's createFreeOrder() server action. Lets mobile create a
-- confirmed/paid free order via a single RPC call without going through
-- a payment provider edge function.
--
-- SECURITY DEFINER bypasses RLS for inserts into orders/order_items/
-- coupon_usages. Server-side total verification + point balance check
-- prevents users from faking 0-MNT orders for paid items.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_free_order(
  p_items jsonb,
  p_address jsonb,
  p_points_used integer DEFAULT 0,
  p_point_discount numeric DEFAULT 0,
  p_coupon_id uuid DEFAULT NULL,
  p_coupon_discount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_ts text;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_items_total numeric := 0;
  v_delivery_fee numeric := 0;
  v_zone record;
  v_city text;
  v_final_total numeric;
  v_balance integer;
  v_coupon record;
  v_user_coupon_count integer;
  v_per_user_limit integer;
  i integer;
BEGIN
  -- 1. Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  -- 2. Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Сагс хоосон байна');
  END IF;

  -- 3. Validate address
  v_city := p_address->>'city';
  IF v_city IS NULL OR v_city = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Хот/Аймаг сонгоно уу');
  END IF;
  IF (p_address->>'district') IS NULL OR (p_address->>'district') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Дүүрэг/Сум сонгоно уу');
  END IF;
  IF (p_address->>'sub_district') IS NULL OR (p_address->>'sub_district') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Хороо/Баг сонгоно уу');
  END IF;
  IF (p_address->>'detail') IS NULL OR TRIM(p_address->>'detail') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Дэлгэрэнгүй хаяг оруулна уу');
  END IF;

  -- 4. Server-side validation + total calculation (don't trust client prices)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Тоо ширхэг буруу байна');
    END IF;

    -- Verify product is active
    IF NOT EXISTS (
      SELECT 1 FROM products WHERE id = v_product_id AND is_active = true
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Бүтээгдэхүүн идэвхгүй байна');
    END IF;

    -- Lookup price (variant first, else product)
    IF v_variant_id IS NOT NULL THEN
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM product_variants
      WHERE id = v_variant_id AND status = 'active' AND stock_quantity >= v_quantity;

      IF v_unit_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Хувилбар идэвхгүй эсвэл нөөц хүрэлцэхгүй байна');
      END IF;
    ELSE
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM products
      WHERE id = v_product_id AND stock_quantity >= v_quantity;

      IF v_unit_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Бүтээгдэхүүн нөөц хүрэлцэхгүй байна');
      END IF;
    END IF;

    v_items_total := v_items_total + (v_unit_price * v_quantity);
  END LOOP;

  -- 5. Calculate delivery fee from delivery_zones (matches web's calculateDeliveryFee)
  IF v_city = 'Улаанбаатар' THEN
    SELECT * INTO v_zone FROM delivery_zones WHERE name = 'Улаанбаатар' AND is_active = true;
  ELSE
    SELECT * INTO v_zone FROM delivery_zones WHERE name = 'Орон нутаг' AND is_active = true;
  END IF;

  IF v_zone IS NOT NULL THEN
    IF v_zone.is_free_delivery_enabled
       AND v_zone.free_delivery_threshold IS NOT NULL
       AND v_items_total >= v_zone.free_delivery_threshold THEN
      v_delivery_fee := 0;
    ELSE
      v_delivery_fee := COALESCE(v_zone.delivery_fee, 0);
    END IF;
  END IF;

  -- 6. Verify final total = 0 (small epsilon for floating point)
  v_final_total := v_items_total + v_delivery_fee - COALESCE(p_coupon_discount, 0) - COALESCE(p_point_discount, 0);
  IF v_final_total > 0.01 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Төлбөрийн дүн 0-ээс их байна',
      'computed_total', v_final_total
    );
  END IF;

  -- 7. Verify point balance is sufficient
  IF p_points_used > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM point_transactions
    WHERE user_id = v_user_id;

    IF v_balance < p_points_used THEN
      RETURN jsonb_build_object('success', false, 'error', 'Онооны үлдэгдэл хүрэлцэхгүй байна');
    END IF;
  END IF;

  -- 8. Generate 8-char order number (4 timestamp base36 + 4 random)
  v_ts := UPPER(LPAD(
    TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT),
    8, '0'
  ));
  v_order_number := SUBSTR(v_ts, LENGTH(v_ts) - 3, 4);
  FOR i IN 1..4 LOOP
    v_order_number := v_order_number || SUBSTR(v_chars, FLOOR(RANDOM() * 36)::int + 1, 1);
  END LOOP;

  -- 9. Insert order (confirmed + paid + free)
  INSERT INTO orders (
    user_id, order_number, status, payment_status, paid_at,
    payment_method, total_amount, delivery_fee,
    points_used, coupon_id, coupon_discount,
    delivery_city, delivery_district, delivery_sub_district, delivery_detail
  ) VALUES (
    v_user_id, v_order_number, 'confirmed', 'paid', NOW(),
    'free', 0, v_delivery_fee,
    COALESCE(p_points_used, 0), p_coupon_id, COALESCE(p_coupon_discount, 0),
    p_address->>'city', p_address->>'district',
    p_address->>'sub_district', p_address->>'detail'
  )
  RETURNING id INTO v_order_id;

  -- 10. Insert order items (re-iterate; trust DB price as source of truth)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_variant_id IS NOT NULL THEN
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM product_variants WHERE id = v_variant_id;
    ELSE
      SELECT COALESCE(NULLIF(discount_price, 0), price) INTO v_unit_price
      FROM products WHERE id = v_product_id;
    END IF;

    INSERT INTO order_items (
      order_id, product_id, variant_id, variant_name, price, quantity
    ) VALUES (
      v_order_id, v_product_id, v_variant_id,
      v_item->>'variant_name', v_unit_price, v_quantity
    );
  END LOOP;

  -- 11. Decrement stock + mark
  PERFORM decrement_order_stock(v_order_id);
  UPDATE orders SET stock_decremented = true WHERE id = v_order_id;

  -- 12. Record point usage (idempotent — guarded by NOT EXISTS check)
  IF p_points_used > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM point_transactions
      WHERE order_id = v_order_id AND type = 'used'
    ) THEN
      INSERT INTO point_transactions (user_id, order_id, type, amount, description)
      VALUES (v_user_id, v_order_id, 'used', -p_points_used, 'Захиалга #' || v_order_number);
    END IF;
  END IF;

  -- 13. Record coupon usage (with limit checks)
  IF p_coupon_id IS NOT NULL AND COALESCE(p_coupon_discount, 0) > 0 THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;

    IF FOUND THEN
      v_per_user_limit := COALESCE(v_coupon.usage_limit_per_user, 1);

      SELECT COUNT(*) INTO v_user_coupon_count
      FROM coupon_usages
      WHERE coupon_id = p_coupon_id AND user_id = v_user_id;

      IF (v_coupon.usage_limit IS NULL OR COALESCE(v_coupon.usage_count, 0) < v_coupon.usage_limit)
         AND v_user_coupon_count < v_per_user_limit THEN
        INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount)
        VALUES (p_coupon_id, v_user_id, v_order_id, p_coupon_discount);

        UPDATE coupons
        SET usage_count = COALESCE(usage_count, 0) + 1
        WHERE id = p_coupon_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_free_order(jsonb, jsonb, integer, numeric, uuid, numeric) TO authenticated;

-- ============================================================================
-- 20260430100000_orders_ensure_public_user_trigger.sql
-- ============================================================================

-- ============================================================================
-- Defense-in-depth: ensure public.users row exists before any orders insert
--
-- Background: handle_new_user() can fail to create the matching public.users
-- row in rare edge cases (silent error during signup, social-login race),
-- leaving auth.users without a public.users counterpart. The next time that
-- user places an order, orders.user_id -> public.users(id) FK fails with
-- "Validation failed: User must exist".
--
-- Web's checkout calls ensurePublicUser() before each orders insert
-- (frontend/src/components/checkout/actions.ts, 5 sites). Mobile and other
-- direct clients skip that safety net, so the FK still occasionally fires —
-- exactly the StorePay failure reported on 2026-04-30.
--
-- This BEFORE INSERT trigger calls ensure_public_user(NEW.user_id) on every
-- orders row, making the safety net universal regardless of which client
-- (web, mobile, admin, edge function) creates the order.
--
-- Performance: ensure_public_user() short-circuits with a single existence
-- check when the public.users row already exists (the normal case).
--
-- Failure containment: ensure_public_user() can fail for reasons unrelated
-- to the order itself (privilege issues, email uniqueness conflict, missing
-- auth.users row for admin-created orders). The trap below makes the safety
-- net best-effort: if it fails, log a WARNING and let the order INSERT
-- proceed. The pre-existing FK orders.user_id -> public.users(id) still
-- protects the data; this just stops the trigger from blocking *every*
-- order when the safety net itself errors out.
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_public_user_for_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      PERFORM ensure_public_user(NEW.user_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING
        'ensure_public_user_for_order: ensure_public_user failed for user_id=%: % (SQLSTATE=%)',
        NEW.user_id, SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_public_user_before_order_insert ON orders;

CREATE TRIGGER ensure_public_user_before_order_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_public_user_for_order();

-- ============================================================================
-- 20260501000000_delete_unpaid_order_rpc.sql
-- ============================================================================

-- ============================================================================
-- delete_unpaid_order RPC: cancel an unpaid order owned by the caller
--
-- Background: mobile (profile_controller.dart:449-459) calls this RPC to
-- delete unpaid orders from the user's order list. The RPC was applied to
-- production manually but never committed as a migration. As a result the
-- production version is unknown and appears to be missing FK cleanup —
-- callers report intermittent "Захиалга устгахад алдаа гарлаа" errors on
-- orders that have entries in `payments` (RESTRICT) or `point_transactions`
-- (NO ACTION default).
--
-- This canonical version mirrors delete_user()'s cleanup ordering:
--   1. Null out point_transactions.order_id (preserve audit trail, drop link)
--   2. Delete payments  (RESTRICT FK)
--   3. Delete payment_invoices  (SET NULL — could rely on FK, but explicit)
--   4. Delete orders  (CASCADE: order_items, order_status_history)
--
-- Safety:
--   - SECURITY DEFINER + auth.uid() ownership check
--   - payment_status must be 'unpaid' or 'processing'
--   - Returns jsonb so callers can handle the not-found / not-allowed cases
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_unpaid_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  SELECT id, user_id, payment_status
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Захиалга олдсонгүй');
  END IF;

  IF v_order.user_id <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Энэ захиалгыг устгах эрхгүй');
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'processing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Зөвхөн төлбөр хийгдээгүй захиалгыг устгах боломжтой'
    );
  END IF;

  -- 1. Drop point_transactions order link (keep audit trail).
  UPDATE point_transactions
  SET order_id = NULL
  WHERE order_id = p_order_id;

  -- 2. Legacy payments table has RESTRICT — must clear first.
  DELETE FROM payments WHERE order_id = p_order_id;

  -- 3. payment_invoices is SET NULL on FK; deleting them is cleaner anyway
  --    since they are now orphan invoices for a cancelled order.
  DELETE FROM payment_invoices WHERE order_id = p_order_id;

  -- 4. Delete the order. CASCADE removes order_items + order_status_history.
  --    SET NULL on: coupon_usages.order_id, notifications.order_id,
  --    admin_features tables.
  DELETE FROM orders WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_unpaid_order(uuid) TO authenticated;

-- ============================================================================
-- 20260502100000_orders_soft_delete.sql
-- ============================================================================

-- ============================================================================
-- Soft-delete for orders
--
-- Replaces the hard-delete flow in delete_unpaid_order so we never lose the
-- order or its payment_invoices rows. The risk we're closing:
--
--   T0: user starts QPay → order + payment_invoices created, QR shown
--   T1: user (or another tab) calls delete_unpaid_order
--   T2: under the old hard-delete RPC the invoice row was DELETEd, so a
--       callback arriving at T3 had nothing to match → user paid, system
--       lost the order, no recovery possible.
--
-- Soft-delete keeps everything in place. Lists filter on is_deleted=false
-- (see frontend + mobile changes accompanying this migration). If a callback
-- still arrives after the user "deleted" the order, create_order_from_invoice
-- now also flips is_deleted back to false and confirms the order — money is
-- never lost.
-- ============================================================================

-- 1. Schema additions ---------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index keeps the user-orders list query fast even after months of
-- soft-deletes accumulate. All app reads filter is_deleted = false.
CREATE INDEX IF NOT EXISTS idx_orders_user_active
  ON orders(user_id, created_at DESC)
  WHERE is_deleted = false;

-- 2. delete_unpaid_order: soft delete instead of hard --------------------------
-- DROP first because the previous version may have a different return type
-- in production; CREATE OR REPLACE can't change return signatures.
DROP FUNCTION IF EXISTS delete_unpaid_order(uuid);

CREATE OR REPLACE FUNCTION delete_unpaid_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  SELECT id, user_id, payment_status, is_deleted
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Захиалга олдсонгүй');
  END IF;

  IF v_order.user_id <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Энэ захиалгыг устгах эрхгүй');
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'processing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Зөвхөн төлбөр хийгдээгүй захиалгыг устгах боломжтой'
    );
  END IF;

  IF v_order.is_deleted THEN
    -- Idempotent: already hidden, nothing to do.
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'already_deleted', true);
  END IF;

  -- Hide the order from the user's lists. Keep order_items, payment_invoices,
  -- coupon_usages, point_transactions intact so callbacks/recovery still
  -- have everything they need if the user ends up paying anyway.
  UPDATE orders
  SET is_deleted = true,
      deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_unpaid_order(uuid) TO authenticated;

-- 3. create_order_from_invoice: resurrect on payment ---------------------------
-- If the user soft-deleted an order and then ended up paying anyway (race or
-- mind-changed), the callback path must un-hide it so admin/user actually see
-- the paid order. We only patch the two existing branches that update an
-- existing orders row — the legacy "create new order" branch is unchanged.
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- Path 1: invoice already linked to an order — confirm + resurrect if soft-deleted.
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                is_deleted = false,
                deleted_at = NULL,
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid' OR is_deleted = true);

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- Path 2: link by order_number — same resurrect logic.
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                is_deleted = false,
                deleted_at = NULL,
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid' OR is_deleted = true);

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- Path 3 (legacy): create new order from pending_order_data. Unchanged.
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    v_address := v_invoice.pending_order_data->'address';

    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented, paid_at
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true, now()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    PERFORM decrement_order_stock(v_order_id);

    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$;
