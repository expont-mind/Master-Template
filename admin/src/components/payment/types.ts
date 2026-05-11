import type { TransactionStatus } from "@/types/database";

export interface PaymentWithOrder {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  status: TransactionStatus;
  transaction_ref: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    users: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      primary_phone: string | null;
    } | null;
  } | null;
}

export interface PaymentDetails extends PaymentWithOrder {
  orders: {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    users: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      primary_phone: string | null;
    } | null;
    order_items: {
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      products: {
        id: string;
        name: string;
      } | null;
    }[];
  } | null;
}
