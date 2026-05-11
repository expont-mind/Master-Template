"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/components/notification/types";

export { formatRelativeTime } from "@/lib/utils/formatters";

// Fetch recent notifications for panel (limit 20)
export function useRecentNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.lists({ limit: 20 }),
    queryFn: () =>
      adminApi.getAll<Notification>("notifications", {
        select:
          "id, user_id, type, title, body, is_read, created_at, users(id, first_name, last_name, email)",
        order: "created_at.desc",
        limit: 20,
      }),
    staleTime: 30_000,
  });
}

// Fetch unread notification count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const result = await adminApi.getAllPaginated<Notification>(
        "notifications",
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

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await adminApi.update("notifications", notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Fetch all unread notifications
      const unreadNotifications = await adminApi.getAll<Notification>(
        "notifications",
        {
          filters: { "is_read.is": "false" },
          select: "id",
        }
      );

      // Mark each as read
      await Promise.all(
        unreadNotifications.map((n) =>
          adminApi.update("notifications", n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Get notification type label in Mongolian
export function getNotificationTypeLabel(
  type: string
): { label: string; color: string } {
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
