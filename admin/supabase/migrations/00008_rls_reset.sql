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
