export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ENUM Types from database
export type UserStatus = "active" | "inactive" | "banned";
export type ProductStatus = "active" | "inactive" | "draft";
export type OrderStatus = "pending" | "confirmed" | "canceled";
export type DeliveryStatus = "pending" | "preparing" | "confirmed" | "shipped" | "delivered" | "canceled";
export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed";
export type TransactionStatus = "pending" | "success" | "failed";
export type PaymentMethod = "qpay" | "lendmn" | "storepay" | "transfer" | "free";
export type ReviewStatus = "active" | "hidden" | "flagged";
export type ContentStatus = "draft" | "published" | "archived";
export type NotificationType = "order" | "payment" | "promotion" | "system";
export type AdminRole = "super_admin" | "operator" | "content_manager" | "support";
export type AuditAction = "INSERT" | "UPDATE" | "DELETE";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type RefundStatus = "pending" | "approved" | "rejected" | "completed";
export type BannerPosition = "home_hero" | "home_secondary" | "category" | "product" | "checkout";
export type CouponType = "fixed" | "percentage" | "free_shipping";
export type CouponScope = "all" | "category" | "product" | "brand";
export type AdPosition = "home" | "category" | "product" | "search" | "checkout";
export type SmsStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type StockAdjustmentType = "in" | "out" | "adjustment" | "return";
export type WarehouseType = "main" | "secondary" | "distribution";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          primary_phone: string | null;
          secondary_phone: string | null;
          avatar_url: string | null;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          avatar_url?: string | null;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          avatar_url?: string | null;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      auth_sessions: {
        Row: {
          id: string;
          user_id: string;
          refresh_token: string;
          device_info: Json | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          refresh_token: string;
          device_info?: Json | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          refresh_token?: string;
          device_info?: Json | null;
          expires_at?: string;
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          image: string | null;
          is_active: boolean;
          is_featured: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          image?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          image?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          description: string | null;
          price: number;
          discount_price: number | null;
          brand_id: string | null;
          category_id: string | null;
          status: ProductStatus;
          original_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          brand_id?: string | null;
          category_id?: string | null;
          status?: ProductStatus;
          original_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          brand_id?: string | null;
          category_id?: string | null;
          status?: ProductStatus;
          original_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
        };
        Insert: {
          product_id: string;
          category_id: string;
        };
        Update: {
          product_id?: string;
          category_id?: string;
        };
      };
      inventory: {
        Row: {
          product_id: string;
          stock_quantity: number;
          reserved_quantity: number;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          stock_quantity?: number;
          reserved_quantity?: number;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          stock_quantity?: number;
          reserved_quantity?: number;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          wishlist_id: string;
          product_id: string;
        };
        Insert: {
          wishlist_id: string;
          product_id: string;
        };
        Update: {
          wishlist_id?: string;
          product_id?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment: string | null;
          status: ReviewStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment?: string | null;
          status?: ReviewStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          rating?: number;
          comment?: string | null;
          status?: ReviewStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: OrderStatus;
          delivery_status: DeliveryStatus;
          total_amount: number;
          delivery_fee: number;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          is_printed: boolean;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: OrderStatus;
          delivery_status?: DeliveryStatus;
          total_amount: number;
          delivery_fee?: number;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          is_printed?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: OrderStatus;
          delivery_status?: DeliveryStatus;
          total_amount?: number;
          delivery_fee?: number;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          is_printed?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
          warehouse_id: string | null;
          is_returned: boolean;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
          warehouse_id?: string | null;
          is_returned?: boolean;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          price?: number;
          quantity?: number;
          warehouse_id?: string | null;
          is_returned?: boolean;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          amount: number;
          status: TransactionStatus;
          transaction_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider?: string;
          amount: number;
          status?: TransactionStatus;
          transaction_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: string;
          amount?: number;
          status?: TransactionStatus;
          transaction_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string | null;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title?: string | null;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string | null;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          city: string | null;
          district: string | null;
          sub_district: string | null;
          detail: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          city?: string | null;
          district?: string | null;
          sub_district?: string | null;
          detail?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          city?: string | null;
          district?: string | null;
          sub_district?: string | null;
          detail?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          content: string | null;
          image_url: string | null;
          type: string;
          is_featured: boolean;
          status: ContentStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string | null;
          content?: string | null;
          image_url?: string | null;
          type?: string;
          is_featured?: boolean;
          status?: ContentStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string | null;
          content?: string | null;
          image_url?: string | null;
          type?: string;
          is_featured?: boolean;
          status?: ContentStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          key: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          description?: string | null;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          email: string;
          two_factor_enabled: boolean;
          role_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          two_factor_enabled?: boolean;
          role_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          two_factor_enabled?: boolean;
          role_id?: string | null;
          created_at?: string;
        };
      };
      admin_login_emails: {
        Row: {
          id: string;
          admin_id: string;
          email: string;
          is_verified: boolean;
          verification_code: string | null;
          verification_expires_at: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          email: string;
          is_verified?: boolean;
          verification_code?: string | null;
          verification_expires_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          email?: string;
          is_verified?: boolean;
          verification_code?: string | null;
          verification_expires_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      // Product Variant System
      product_attributes: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_attribute_values: {
        Row: {
          id: string;
          attribute_id: string;
          value: string;
          display_value: string;
          color_hex: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attribute_id: string;
          value: string;
          display_value: string;
          color_hex?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attribute_id?: string;
          value?: string;
          display_value?: string;
          color_hex?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_attribute_configs: {
        Row: {
          id: string;
          product_id: string;
          attribute_id: string;
          is_required: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          attribute_id: string;
          is_required?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          attribute_id?: string;
          is_required?: boolean;
          sort_order?: number;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          name: string | null;
          price: number;
          discount_price: number | null;
          stock_quantity: number;
          reserved_quantity: number;
          is_default: boolean;
          status: ProductStatus;
          option_values: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          name?: string | null;
          price: number;
          discount_price?: number | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          is_default?: boolean;
          status?: ProductStatus;
          option_values?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string | null;
          name?: string | null;
          price?: number;
          discount_price?: number | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          is_default?: boolean;
          status?: ProductStatus;
          option_values?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variant_attributes: {
        Row: {
          variant_id: string;
          attribute_value_id: string;
        };
        Insert: {
          variant_id: string;
          attribute_value_id: string;
        };
        Update: {
          variant_id?: string;
          attribute_value_id?: string;
        };
      };
      product_variant_details: {
        Row: {
          id: string;
          variant_id: string;
          type: string;
          content: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          type: string;
          content: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          type?: string;
          content?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          url: string;
          alt_text?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          url?: string;
          alt_text?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string | null;
          sort_order: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          category?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          delivery_fee: number;
          free_delivery_threshold: number | null;
          is_free_delivery_enabled: boolean;
          estimated_days_min: number;
          estimated_days_max: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          is_free_delivery_enabled?: boolean;
          estimated_days_min?: number;
          estimated_days_max?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          is_free_delivery_enabled?: boolean;
          estimated_days_min?: number;
          estimated_days_max?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_links: {
        Row: {
          id: string;
          platform: string;
          url: string;
          icon_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: string;
          url: string;
          icon_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: string;
          url?: string;
          icon_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      policies: {
        Row: {
          id: string;
          type: string;
          title: string;
          slug: string;
          content: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          slug: string;
          content?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          weekday_hours: string | null;
          weekend_hours: string | null;
          address: string | null;
          google_maps_url: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          weekday_hours?: string | null;
          weekend_hours?: string | null;
          address?: string | null;
          google_maps_url?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          weekday_hours?: string | null;
          weekend_hours?: string | null;
          address?: string | null;
          google_maps_url?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      branch_inventory: {
        Row: {
          id: string;
          branch_id: string;
          product_id: string;
          variant_id: string | null;
          stock_quantity: number;
          reserved_quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          product_id: string;
          variant_id?: string | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          product_id?: string;
          variant_id?: string | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          currency: string;
          is_active: boolean;
          is_default: boolean;
          logo_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          currency?: string;
          is_active?: boolean;
          is_default?: boolean;
          logo_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_name?: string;
          account_name?: string;
          account_number?: string;
          currency?: string;
          is_active?: boolean;
          is_default?: boolean;
          logo_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ads: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string;
          position: AdPosition;
          link_url: string | null;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          click_count: number;
          view_count: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url: string;
          position?: AdPosition;
          link_url?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          click_count?: number;
          view_count?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          position?: AdPosition;
          link_url?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          click_count?: number;
          view_count?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          type: WarehouseType;
          address: string | null;
          city: string | null;
          district: string | null;
          phone: string | null;
          email: string | null;
          manager_name: string | null;
          is_active: boolean;
          is_default: boolean;
          sort_order: number;
          name_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          type?: WarehouseType;
          address?: string | null;
          city?: string | null;
          district?: string | null;
          phone?: string | null;
          email?: string | null;
          manager_name?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          sort_order?: number;
          name_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          type?: WarehouseType;
          address?: string | null;
          city?: string | null;
          district?: string | null;
          phone?: string | null;
          email?: string | null;
          manager_name?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          sort_order?: number;
          name_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouse_inventory: {
        Row: {
          id: string;
          warehouse_id: string;
          product_id: string;
          variant_id: string | null;
          stock_quantity: number;
          reserved_quantity: number;
          min_stock_level: number;
          max_stock_level: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          product_id: string;
          variant_id?: string | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          min_stock_level?: number;
          max_stock_level?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          warehouse_id?: string;
          product_id?: string;
          variant_id?: string | null;
          stock_quantity?: number;
          reserved_quantity?: number;
          min_stock_level?: number;
          max_stock_level?: number | null;
          updated_at?: string;
        };
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          body: string | null;
          metadata: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type?: string;
          title: string;
          body?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role_id: string | null;
          created_at: string;
          two_factor_enabled: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role_id?: string | null;
          created_at?: string;
          two_factor_enabled?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role_id?: string | null;
          created_at?: string;
          two_factor_enabled?: boolean;
        };
      };
      admin_login_emails: {
        Row: {
          id: string;
          admin_id: string;
          email: string;
          is_verified: boolean;
          verification_code: string | null;
          verification_expires_at: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          email: string;
          is_verified?: boolean;
          verification_code?: string | null;
          verification_expires_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          email?: string;
          is_verified?: boolean;
          verification_code?: string | null;
          verification_expires_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      sms_campaigns: {
        Row: {
          id: string;
          name: string;
          message: string;
          status: "draft" | "scheduled" | "sending" | "sent" | "failed";
          recipient_filter: Json | null;
          recipient_count: number;
          sent_count: number;
          failed_count: number;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          message: string;
          status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
          recipient_filter?: Json | null;
          recipient_count?: number;
          sent_count?: number;
          failed_count?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          message?: string;
          status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
          recipient_filter?: Json | null;
          recipient_count?: number;
          sent_count?: number;
          failed_count?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sms_logs: {
        Row: {
          id: string;
          campaign_id: string | null;
          user_id: string | null;
          phone: string;
          message: string;
          status: string;
          provider: string | null;
          provider_message_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          user_id?: string | null;
          phone: string;
          message: string;
          status?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          user_id?: string | null;
          phone?: string;
          message?: string;
          status?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_product: {
        Args: {
          p_product: Json;
          p_variants: Json;
          p_images: Json;
          p_category_ids: string[];
          p_details?: Json;
        };
        Returns: string;
      };
      get_variant_details_batch: {
        Args: {
          p_variant_ids: string[];
        };
        Returns: {
          id: string;
          variant_id: string;
          type: string;
          content: string;
          sort_order: number;
        }[];
      };
    };
    Enums: {
      user_status: UserStatus;
      product_status: ProductStatus;
      order_status: OrderStatus;
      delivery_status: DeliveryStatus;
      payment_status: PaymentStatus;
      transaction_status: TransactionStatus;
      review_status: ReviewStatus;
      content_status: ContentStatus;
      notification_type: NotificationType;
      admin_role: AdminRole;
      audit_action: AuditAction;
      ticket_status: TicketStatus;
      ticket_priority: TicketPriority;
      refund_status: RefundStatus;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
