"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminNotification } from "@/components/notification/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export { formatRelativeTime } from "@/lib/utils/formatters";

// Fetch recent admin notifications
export function useAdminNotifications(limit = 20) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, "admin", { limit }],
    queryFn: () =>
      adminApi.getAll<AdminNotification>("admin_notifications", {
        order: "created_at.desc",
        limit,
      }),
    staleTime: 30_000,
  });
}

// Fetch unread admin notification count
export function useUnreadAdminNotificationCount() {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, "admin", "unreadCount"],
    queryFn: async () => {
      const result = await adminApi.getAllPaginated<AdminNotification>(
        "admin_notifications",
        {
          filters: { "is_read.is": "false" },
          limit: 1,
        }
      );
      return result.totalCount ?? 0;
    },
    staleTime: 30_000,
  });
}

// Mark admin notification as read
export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await adminApi.update("admin_notifications", notificationId, {
        is_read: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.notifications.all, "admin"],
      });
    },
  });
}

// Mark all admin notifications as read
export function useMarkAllAdminNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const unreadNotifications = await adminApi.getAll<AdminNotification>(
        "admin_notifications",
        {
          filters: { "is_read.is": "false" },
          select: "id",
        }
      );

      await Promise.all(
        unreadNotifications.map((n) =>
          adminApi.update("admin_notifications", n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.notifications.all, "admin"],
      });
    },
  });
}

// Real-time subscription hook
export function useRealtimeAdminNotifications() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.notifications.all, "admin"],
    });
  }, [queryClient]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel("admin_notifications_changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "admin_notifications",
          },
          () => {
            // Invalidate queries to refetch with new notification
            invalidateNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "admin_notifications",
          },
          () => {
            // Invalidate on updates (e.g., mark as read)
            invalidateNotifications();
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, invalidateNotifications]);
}

// Get notification type label in Mongolian
export function getNotificationTypeLabel(type: string): {
  label: string;
  color: string;
} {
  switch (type) {
    case "order":
      return { label: "Захиалга", color: "bg-blue-100 text-blue-800" };
    case "payment":
      return { label: "Төлбөр", color: "bg-green-100 text-green-800" };
    case "promotion":
      return { label: "Урамшуулал", color: "bg-purple-100 text-purple-800" };
    case "system":
      return { label: "Систем", color: "bg-gray-100 text-gray-800" };
    default:
      return { label: "Бусад", color: "bg-gray-100 text-gray-800" };
  }
}
