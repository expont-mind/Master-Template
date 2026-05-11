// Database types - Replace with generated types from `supabase gen types typescript`
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
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
          name?: string | null;
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
          name?: string | null;
          city?: string | null;
          district?: string | null;
          sub_district?: string | null;
          detail?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          banner_image: string | null;
          type: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          banner_image?: string | null;
          type?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          banner_image?: string | null;
          type?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          status: "draft" | "published" | "archived";
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
          status?: "draft" | "published" | "archived";
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
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          avatar_url: string | null;
          status: string;
          first_name: string | null;
          last_name: string | null;
          primary_phone: string | null;
          secondary_phone: string | null;
          point_activated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          avatar_url?: string | null;
          status?: string;
          first_name?: string | null;
          last_name?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          point_activated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          avatar_url?: string | null;
          status?: string;
          first_name?: string | null;
          last_name?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          point_activated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          discount_price: number | null;
          sku: string | null;
          barcode: string | null;
          stock_quantity: number;
          is_active: boolean;
          is_featured: boolean;
          category_id: string | null;
          brand_id: string | null;
          images: string[];
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          stock_quantity?: number;
          is_active?: boolean;
          is_featured?: boolean;
          category_id?: string | null;
          brand_id?: string | null;
          images?: string[];
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          stock_quantity?: number;
          is_active?: boolean;
          is_featured?: boolean;
          category_id?: string | null;
          brand_id?: string | null;
          images?: string[];
          metadata?: Json | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          image: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          image?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          image?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string;
          image_url: string;
          variant: "rose" | "blue";
          category_id: string | null;
          product_id: string | null;
          link_url: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description: string;
          image_url: string;
          variant?: "rose" | "blue";
          category_id?: string | null;
          product_id?: string | null;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
          image_url?: string;
          variant?: "rose" | "blue";
          category_id?: string | null;
          product_id?: string | null;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "banners_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "banners_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          delivery_status:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | null;
          total_amount: number;
          delivery_fee: number;
          payment_status: "pending" | "paid" | "failed" | "refunded" | "unpaid";
          payment_method: "qpay" | "lendmn" | "storepay" | "transfer" | "free";
          paid_at: string | null;
          points_used: number;
          coupon_id: string | null;
          coupon_discount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          delivery_status?:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | null;
          total_amount: number;
          delivery_fee?: number;
          payment_status?: "pending" | "paid" | "failed" | "refunded" | "unpaid";
          payment_method?: "qpay" | "lendmn" | "storepay" | "transfer" | "free";
          paid_at?: string | null;
          points_used?: number;
          coupon_id?: string | null;
          coupon_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          delivery_status?:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | null;
          total_amount?: number;
          delivery_fee?: number;
          payment_status?: "pending" | "paid" | "failed" | "refunded" | "unpaid";
          payment_method?: "qpay" | "lendmn" | "storepay" | "transfer" | "free";
          paid_at?: string | null;
          points_used?: number;
          coupon_id?: string | null;
          coupon_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
          variant_id: string | null;
          variant_name: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          price?: number;
          quantity?: number;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      payment_invoices: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          status: "pending" | "paid" | "failed";
          order_number: string | null;
          provider: string;
          external_invoice_number: string | null;
          paid_amount: number | null;
          transaction_id: string | null;
          payment_wallet: string | null;
          pending_order_data: Json | null;
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          amount: number;
          status?: "pending" | "paid" | "failed";
          order_number?: string | null;
          provider?: string;
          external_invoice_number?: string | null;
          paid_amount?: number | null;
          transaction_id?: string | null;
          payment_wallet?: string | null;
          pending_order_data?: Json | null;
          order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          status?: "pending" | "paid" | "failed";
          order_number?: string | null;
          provider?: string;
          external_invoice_number?: string | null;
          paid_amount?: number | null;
          transaction_id?: string | null;
          payment_wallet?: string | null;
          pending_order_data?: Json | null;
          order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment: string | null;
          images: string[] | null;
          status: "active" | "hidden" | "flagged";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment?: string | null;
          images?: string[] | null;
          status?: "active" | "hidden" | "flagged";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          rating?: number;
          comment?: string | null;
          images?: string[] | null;
          status?: "active" | "hidden" | "flagged";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          is_default: boolean;
          status: string;
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
          is_default?: boolean;
          status?: string;
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
          is_default?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_details: {
        Row: {
          id: string;
          product_id: string;
          type: string;
          content: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: string;
          content: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          type?: string;
          content?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      product_rich_descriptions: {
        Row: {
          id: string;
          product_id: string;
          content: string | null;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          content?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          content?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "order" | "payment" | "promotion" | "system";
          title: string | null;
          body: string | null;
          is_read: boolean;
          created_at: string;
          order_id: string | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "order" | "payment" | "promotion" | "system";
          title?: string | null;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
          order_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "order" | "payment" | "promotion" | "system";
          title?: string | null;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
          order_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status_type: "order" | "delivery" | "payment";
          previous_status: string | null;
          new_status: string;
          changed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status_type: "order" | "delivery" | "payment";
          previous_status?: string | null;
          new_status: string;
          changed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status_type?: "order" | "delivery" | "payment";
          previous_status?: string | null;
          new_status?: string;
          changed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      search_logs: {
        Row: {
          id: string;
          query: string;
          raw_query: string;
          user_id: string | null;
          session_id: string | null;
          result_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          query: string;
          raw_query: string;
          user_id?: string | null;
          session_id?: string | null;
          result_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          query?: string;
          raw_query?: string;
          user_id?: string | null;
          session_id?: string | null;
          result_count?: number;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          // event_date is NOT in the live schema — kept optional so
          // consumers (e.g. EventCard) that reference it still compile.
          event_date?: string;
          start_date: string | null;
          end_date: string | null;
          location: string | null;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          event_date?: string;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          event_date?: string;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          delivery_fee: number;
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_suggestions: {
        Args: {
          p_search_query: string;
          p_max_results?: number;
        };
        Returns: {
          type: string;
          text: string;
          slug: string;
          image: string | null;
          similarity: number;
        }[];
      };
      search_products: {
        Args: {
          p_search_query: string;
          p_category_slug?: string | null;
          p_min_price?: number | null;
          p_max_price?: number | null;
          p_in_stock?: boolean | null;
          p_sort_by?: string;
          p_page_number?: number;
          p_page_size?: number;
          p_allow_fuzzy?: boolean;
        };
        Returns: {
          id: string;
          name: string;
          slug: string;
          price: number;
          discount_price: number | null;
          images: string[];
          is_featured: boolean;
          stock_quantity: number;
          category_name: string | null;
          category_slug: string | null;
          similarity: number;
          total_count: number;
          fuzzy_fallback: boolean;
        }[];
      };
      get_spelling_suggestion: {
        Args: {
          p_query: string;
        };
        Returns: string | null;
      };
      get_trending_searches: {
        Args: {
          p_limit?: number;
          p_days?: number;
          p_min_count?: number;
        };
        Returns: {
          query: string;
          search_count: number;
          weighted_score: number;
          last_searched_at: string;
        }[];
      };
      create_order_from_invoice: {
        Args: {
          p_invoice_id: string;
        };
        Returns: Json;
      };
      get_best_selling_products: {
        Args: {
          p_period_days?: number;
          p_limit?: number;
        };
        Returns: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          discount_price: number | null;
          sku: string | null;
          barcode: string | null;
          stock_quantity: number;
          is_active: boolean;
          is_featured: boolean;
          category_id: string | null;
          brand_id: string | null;
          images: string[];
          metadata: Json | null;
          total_sold: number;
        }[];
      };
    };
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "refunded";
    };
  };
}

// Convenience types
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = "qpay" | "lendmn" | "storepay" | "transfer" | "free";

// Notification types
export type NotificationType = "order" | "payment" | "promotion" | "system";
export type StatusType = "order" | "delivery" | "payment";
export type DeliveryStatus = "pending" | "confirmed" | "shipped" | "delivered" | "canceled";
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];

// Social link type
export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

// FAQ type
export type FAQ = Database["public"]["Tables"]["faqs"]["Row"];

// Event type
export type Event = Database["public"]["Tables"]["events"]["Row"];

// Branch type
export type Branch = Database["public"]["Tables"]["branches"]["Row"];

// Article type
export type Article = Database["public"]["Tables"]["articles"]["Row"];

// Delivery zone type
export type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];
