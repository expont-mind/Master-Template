"use client";

import { SITE } from "@repo/config-site";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { buildCombinedNotifications } from "./_combineNotifications";
import { notificationKeys } from "./_notificationKeys";

import type { Notification, OrderStatusHistory, StatusType } from "@/types/database";

export { notificationKeys } from "./_notificationKeys";
export {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkStatusChangeRead,
} from "./_notificationMutations";
export { useRealtimeNotifications } from "./_notificationRealtime";

// Every notification query is inert when the feature is disabled — the
// bell, badge, and panel consumers need no flag awareness of their own.
const NOTIFICATIONS_ENABLED = SITE.features.notifications;

// Combined notification type for display
export interface CombinedNotification {
  id: string;
  type: "notification" | "status_change";
  notificationType?: "order" | "payment" | "promotion" | "system";
  statusType?: StatusType;
  title: string;
  body: string | null;
  isRead: boolean;
  timestamp: string;
  orderId?: string;
  previousStatus?: string | null;
  newStatus?: string;
  // Order details for UI display
  orderNumber?: string;
  orderDate?: string;
  orderItemsCount?: number;
  orderTotal?: number;
}

// Order details for status change notifications
export interface OrderDetails {
  id: string;
  order_number: string | null;
  created_at: string;
  total_amount: number;
  itemsCount: number;
}

// Fetch notifications from notifications table
export function useNotifications(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: userId ? notificationKeys.list(userId) : ["notifications-disabled"],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: NOTIFICATIONS_ENABLED && !!userId,
  });
}

// Fetch order status history for the user's orders with order details
export function useOrderStatusHistory(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: userId ? notificationKeys.statusHistory(userId) : ["status-history-disabled"],
    queryFn: async () => {
      if (!userId) {
        return {
          statusHistory: [] as OrderStatusHistory[],
          orderDetailsMap: new Map<string, OrderDetails>(),
        };
      }

      // First get user's orders with details
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          created_at,
          total_amount,
          order_items(id)
        `,
        )
        .eq("user_id", userId);

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) {
        return {
          statusHistory: [] as OrderStatusHistory[],
          orderDetailsMap: new Map<string, OrderDetails>(),
        };
      }

      // Build order details map
      const orderDetailsMap = new Map<string, OrderDetails>();
      for (const order of orders) {
        orderDetailsMap.set(order.id, {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total_amount: order.total_amount,
          itemsCount: Array.isArray(order.order_items) ? order.order_items.length : 0,
        });
      }

      const orderIds = orders.map((o) => o.id);

      // Then get status history for those orders
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .in("order_id", orderIds)
        .order("changed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return {
        statusHistory: data as OrderStatusHistory[],
        orderDetailsMap,
      };
    },
    enabled: NOTIFICATIONS_ENABLED && !!userId,
  });
}

// Combined hook that merges notifications and status history
export function useCombinedNotifications(userId: string | undefined) {
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(userId);
  const { data: statusData, isLoading: statusHistoryLoading } = useOrderStatusHistory(userId);

  const isLoading = notificationsLoading || statusHistoryLoading;
  const limitedNotifications = buildCombinedNotifications(
    notifications,
    statusData?.statusHistory,
    statusData?.orderDetailsMap,
  );

  return {
    notifications: limitedNotifications,
    isLoading,
  };
}

// Get unread notification count (includes both notifications and status changes)
export function useUnreadNotificationCount(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: userId ? notificationKeys.unreadCount(userId) : ["unread-count-disabled"],
    queryFn: async () => {
      if (!userId) return 0;

      // Count unread notifications from database
      const { count: notificationCount, error: notificationError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (notificationError) throw notificationError;

      // Get user's orders to find status changes
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId);
      if (ordersError) throw ordersError;

      let statusChangeUnreadCount = 0;
      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { count: statusCount, error: statusError } = await supabase
          .from("order_status_history")
          .select("*", { count: "exact", head: true })
          .in("order_id", orderIds)
          .eq("is_read", false);
        if (statusError) throw statusError;
        statusChangeUnreadCount = statusCount || 0;
      }

      return (notificationCount || 0) + statusChangeUnreadCount;
    },
    enabled: NOTIFICATIONS_ENABLED && !!userId,
  });
}
