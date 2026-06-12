import type { CombinedNotification, OrderDetails } from "./useNotifications";
import type { Notification, OrderStatusHistory, StatusType } from "@/types/database";

// Status change messages in Mongolian
const STATUS_MESSAGES: Record<StatusType, Record<string, string>> = {
  delivery: {
    pending: "Таны захиалга хүлээгдэж байна",
    confirmed: "Таны захиалга баталгаажлаа",
    shipped: "Таны захиалга хүргэлтэд гарлаа",
    delivered: "Таны захиалга хүргэгдлээ",
    canceled: "Таны захиалга цуцлагдлаа",
  },
  order: {
    pending: "Таны захиалга хүлээгдэж байна",
    confirmed: "Таны захиалга баталгаажлаа",
    canceled: "Таны захиалга цуцлагдлаа",
  },
  payment: {
    unpaid: "Төлбөр хүлээгдэж байна",
    processing: "Төлбөр боловсруулагдаж байна",
    paid: "Төлбөр амжилттай төлөгдлөө",
    failed: "Төлбөр төлөлт амжилтгүй боллоо",
  },
};

export function getStatusMessage(statusType: StatusType, newStatus: string): string {
  return STATUS_MESSAGES[statusType]?.[newStatus] || `Статус өөрчлөгдсөн: ${newStatus}`;
}

function notificationToCombined(n: Notification): CombinedNotification {
  return {
    id: n.id,
    type: "notification",
    notificationType: n.type,
    title: n.title || "Мэдэгдэл",
    body: n.body,
    isRead: n.is_read,
    timestamp: n.created_at,
    orderId: n.order_id ?? undefined,
  };
}

function statusChangeToCombined(
  s: OrderStatusHistory,
  orderDetails: OrderDetails | undefined,
): CombinedNotification {
  return {
    id: s.id,
    type: "status_change",
    statusType: s.status_type,
    title: getStatusMessage(s.status_type, s.new_status),
    body: null,
    isRead: (s as OrderStatusHistory & { is_read?: boolean }).is_read ?? false,
    timestamp: s.changed_at,
    orderId: s.order_id,
    previousStatus: s.previous_status,
    newStatus: s.new_status,
    orderNumber: orderDetails?.order_number ?? s.order_id,
    orderDate: orderDetails?.created_at,
    orderItemsCount: orderDetails?.itemsCount,
    orderTotal: orderDetails?.total_amount,
  };
}

export function buildCombinedNotifications(
  notifications: Notification[] | undefined,
  statusHistory: OrderStatusHistory[] | undefined,
  orderDetailsMap: Map<string, OrderDetails> | undefined,
): CombinedNotification[] {
  const combined: CombinedNotification[] = [];
  if (notifications) {
    for (const n of notifications) combined.push(notificationToCombined(n));
  }
  if (statusHistory) {
    for (const s of statusHistory) {
      combined.push(statusChangeToCombined(s, orderDetailsMap?.get(s.order_id)));
    }
  }
  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined.slice(0, 30);
}
