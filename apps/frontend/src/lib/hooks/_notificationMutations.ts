"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { notificationKeys } from "./_notificationKeys";

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
        .update({ is_read: true })
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
      const { data: orders } = await supabase.from("orders").select("id").eq("user_id", userId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { error: statusError } = await supabase
          .from("order_status_history")
          .update({ is_read: true })
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
      const { data: orders } = await supabase.from("orders").select("id").eq("user_id", userId);

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
