import type { UserStatus, OrderStatus, PaymentStatus } from "@/types/database";

export interface UserAddress {
  id: string;
  city: string | null;
  district: string | null;
  sub_district: string | null;
  detail: string | null;
  is_default: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  primary_phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  point_activated_at: string | null;
  addresses: UserAddress[];
  point_balance?: number;
  order_count?: number;
  total_spent?: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  primary_phone: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  point_balance: number;
  order_count: number;
  total_spent: number;
  total_count: number;
}

export function getFullName(user: User): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Нэр байхгүй";
}

export interface UserOrder {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
}
