// Query keys for notifications
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => [...notificationKeys.all, "list", userId] as const,
  statusHistory: (userId: string) => [...notificationKeys.all, "statusHistory", userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, "unreadCount", userId] as const,
};
