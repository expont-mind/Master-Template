import type { Order, OrderStatus } from "./database";
import type { ProductListItem } from "./product";

// Order item
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product: ProductListItem;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Order with items
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Address type
export interface Address {
  id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  postal_code?: string;
  is_default?: boolean;
}

// Checkout form data
export interface CheckoutData {
  shipping_address: Address;
  billing_address?: Address;
  same_as_shipping: boolean;
  payment_method: PaymentMethod;
  notes?: string;
}

// Payment methods
export type PaymentMethod = "qpay" | "storepay" | "pocket" | "bonum";

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

// Order timeline event
export interface OrderEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
}
