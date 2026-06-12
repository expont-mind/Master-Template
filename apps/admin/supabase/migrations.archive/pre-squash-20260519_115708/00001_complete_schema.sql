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
