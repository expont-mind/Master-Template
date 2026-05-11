"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Notification,
  OrderStatusHistory,
  StatusType,
} from "@/types/database";

// Query keys for notifications
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => [...notificationKeys.all, "list", userId] as const,
  statusHistory: (userId: string) =>
    [...notificationKeys.all, "statusHistory", userId] as const,
  unreadCount: (userId: string) =>
    [...notificationKeys.all, "unreadCount", userId] as const,
};

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

function getStatusMessage(statusType: StatusType, newStatus: string): string {
  return (
    STATUS_MESSAGES[statusType]?.[newStatus] ||
    `Статус өөрчлөгдсөн: ${newStatus}`
  );
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
    enabled: !!userId,
  });
}

// Order details for status change notifications
interface OrderDetails {
  id: string;
  order_number: string | null;
  created_at: string;
  total_amount: number;
  itemsCount: number;
}

// Fetch order status history for the user's orders with order details
export function useOrderStatusHistory(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: userId
      ? notificationKeys.statusHistory(userId)
      : ["status-history-disabled"],
    queryFn: async () => {
      if (!userId) return { statusHistory: [], orderDetailsMap: new Map<string, OrderDetails>() };

      // First get user's orders with details
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          total_amount,
          order_items(id)
        `)
        .eq("user_id", userId);

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return { statusHistory: [], orderDetailsMap: new Map<string, OrderDetails>() };

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
      return { statusHistory: data as OrderStatusHistory[], orderDetailsMap };
    },
    enabled: !!userId,
  });
}

// Combined hook that merges notifications and status history
export function useCombinedNotifications(userId: string | undefined) {
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications(userId);
  const { data: statusData, isLoading: statusHistoryLoading } =
    useOrderStatusHistory(userId);

  const isLoading = notificationsLoading || statusHistoryLoading;

  // Combine and sort notifications
  const combinedNotifications: CombinedNotification[] = [];

  // Add regular notifications
  if (notifications) {
    for (const n of notifications) {
      combinedNotifications.push({
        id: n.id,
        type: "notification",
        notificationType: n.type,
        title: n.title || "Мэдэгдэл",
        body: n.body,
        isRead: n.is_read,
        timestamp: n.created_at,
        orderId: n.order_id ?? undefined,
      });
    }
  }

  // Add status change notifications with order details
  if (statusData?.statusHistory) {
    const { statusHistory, orderDetailsMap } = statusData;
    for (const s of statusHistory) {
      const orderDetails = orderDetailsMap.get(s.order_id);
      combinedNotifications.push({
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
        // Include order details
        orderNumber: orderDetails?.order_number ?? s.order_id,
        orderDate: orderDetails?.created_at,
        orderItemsCount: orderDetails?.itemsCount,
        orderTotal: orderDetails?.total_amount,
      });
    }
  }

  // Sort by timestamp descending
  combinedNotifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Limit to 30 most recent
  const limitedNotifications = combinedNotifications.slice(0, 30);

  return {
    notifications: limitedNotifications,
    isLoading,
  };
}

// Get unread notification count (includes both notifications and status changes)
export function useUnreadNotificationCount(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: userId
      ? notificationKeys.unreadCount(userId)
      : ["unread-count-disabled"],
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
    enabled: !!userId,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Mark status change as read (database)
export function useMarkStatusChangeRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (statusChangeId: string) => {
      const { error } = await supabase
        .from("order_status_history")
        .update({ is_read: true } as Record<string, unknown>)
        .eq("id", statusChangeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Mark all notifications as read (both notifications and order_status_history)
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Mark notifications as read
      const { error: notifError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (notifError) throw notifError;

      // Mark order status history as read
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { error: statusError } = await supabase
          .from("order_status_history")
          .update({ is_read: true } as Record<string, unknown>)
          .in("order_id", orderIds)
          .eq("is_read", false);
        if (statusError) throw statusError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Delete all notifications (both notifications and order_status_history)
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete notifications
      const { error: notifError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);
      if (notifError) throw notifError;

      // Delete order status history
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { error: statusError } = await supabase
          .from("order_status_history")
          .delete()
          .in("order_id", orderIds);
        if (statusError) throw statusError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Real-time subscription hook for notifications
export function useRealtimeNotifications(
  userId: string | undefined,
  options?: {
    onPointGift?: (amount: number, description: string) => void;
  },
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;

    let notificationsChannel: RealtimeChannel | null = null;
    let statusHistoryChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to notifications table changes for this user
      notificationsChannel = supabase
        .channel(`notifications_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            invalidateNotifications();

            // Check if this is an admin gift notification and trigger modal
            const row = payload.new as {
              type?: string;
              metadata?: {
                sub_type?: string;
                amount?: number;
                description?: string;
              } | null;
            };
            if (
              row.type === "promotion" &&
              row.metadata?.sub_type === "admin_gift" &&
              row.metadata.amount &&
              row.metadata.description !== "Шинэ хэрэглэгчийн бонус" &&
              options?.onPointGift
            ) {
              options.onPointGift(
                row.metadata.amount,
                row.metadata.description || "",
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            invalidateNotifications();
          }
        )
        .subscribe();

      // Get user's order IDs for status history subscription
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId);

      if (orders && orders.length > 0) {
        // Subscribe to order_status_history changes for user's orders
        statusHistoryChannel = supabase
          .channel(`order_status_${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "order_status_history",
            },
            (payload) => {
              // Check if this status change is for one of the user's orders
              const orderIds = orders.map((o) => o.id);
              if (orderIds.includes((payload.new as { order_id: string }).order_id)) {
                invalidateNotifications();
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "order_status_history",
            },
            (payload) => {
              const orderIds = orders.map((o) => o.id);
              if (orderIds.includes((payload.new as { order_id: string }).order_id)) {
                invalidateNotifications();
              }
            }
          )
          .subscribe();
      }
    };

    setupSubscriptions();

    return () => {
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
      if (statusHistoryChannel) {
        supabase.removeChannel(statusHistoryChannel);
      }
    };
  }, [userId, supabase, invalidateNotifications]);
}
