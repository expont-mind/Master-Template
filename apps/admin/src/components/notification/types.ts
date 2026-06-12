import type { NotificationType, Json } from "@/types/database";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
  users?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Json;
  is_read: boolean;
  created_at: string;
}

export interface OrderNotificationMetadata {
  order_id: string;
  order_number: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
}

export interface NotificationFormData {
  type: NotificationType;
  title: string;
  body: string;
  user_ids: string[];
}
