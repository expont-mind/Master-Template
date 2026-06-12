import type { CouponType, CouponScope } from "@/types/database";

export interface Coupon {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  type: CouponType;
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  scope: CouponScope;
  usage_limit: number | null;
  usage_count: number;
  usage_limit_per_user: number;
  max_applicable_qty: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponProduct {
  coupon_id: string;
  product_id: string;
  products?: {
    id: string;
    name: string;
  };
}

export interface CouponCategory {
  coupon_id: string;
  category_id: string;
  categories?: {
    id: string;
    name: string;
  };
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string | null;
  discount_amount: number;
  used_at: string;
  users?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface CouponBrand {
  coupon_id: string;
  brand_id: string;
  brands?: {
    id: string;
    name: string;
  };
}

export interface CouponFormData {
  code: string;
  type: CouponType;
  scope: CouponScope;
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  max_applicable_qty: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}
