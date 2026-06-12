import type { OrderStatus, DeliveryStatus, PaymentStatus, PaymentMethod } from "@/types/database";

export interface OrderWithUser {
  id: string;
  user_id: string;
  order_number: string | null;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  total_amount: number;
  delivery_fee: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  is_printed: boolean;
  is_products_printed: boolean;
  is_box_printed: boolean;
  is_downloaded: boolean;
  paid_at: string | null;
  created_at: string;
  delivery_city: string | null;
  delivery_district: string | null;
  delivery_sub_district: string | null;
  delivery_detail: string | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    primary_phone: string | null;
    addresses: {
      city: string | null;
      district: string | null;
      sub_district: string | null;
      detail: string | null;
      is_default: boolean;
    }[];
  } | null;
  order_items: {
    id: string;
    variant_name: string | null;
    quantity: number;
    price: number;
    warehouse_id: string | null;
    is_returned: boolean;
    products: {
      name: string;
      product_images: {
        url: string;
        is_primary: boolean;
      }[];
    } | null;
  }[];
  payment_invoices: {
    payment_wallet: string | null;
  }[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  variant_name: string | null;
  price: number;
  quantity: number;
  warehouse_id: string | null;
  is_returned: boolean;
  products: {
    id: string;
    name: string;
    original_url: string | null;
    product_images: {
      url: string;
      is_primary: boolean;
    }[];
  } | null;
}

export interface UserAddress {
  id: string;
  city: string | null;
  district: string | null;
  sub_district: string | null;
  detail: string | null;
  is_default: boolean;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status_type: "order" | "delivery" | "payment";
  previous_status: string | null;
  new_status: string;
  changed_at: string;
}

export interface OrderTableMeta {
  onUpdateDeliveryStatus?: (orderId: string, deliveryStatus: DeliveryStatus) => void;
  paymentStatusFilter?: string;
  selectedOrderIds?: Set<string>;
  onToggleOrder?: (orderId: string) => void;
  onToggleAllOrders?: (selected: boolean) => void;
}

export interface OrderDetails {
  id: string;
  user_id: string;
  order_number: string | null;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  total_amount: number;
  delivery_fee: number;
  points_used: number;
  coupon_id: string | null;
  coupon_discount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  delivery_city: string | null;
  delivery_district: string | null;
  delivery_sub_district: string | null;
  delivery_detail: string | null;
  payment_invoices: {
    payment_wallet: string | null;
  }[];
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    primary_phone: string | null;
    secondary_phone: string | null;
    addresses: UserAddress[];
  } | null;
  order_items: OrderItem[];
  order_status_history: OrderStatusHistoryEntry[];
  coupon_usages: { discount_amount: number }[];
}
