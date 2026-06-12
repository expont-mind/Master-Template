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
