"use client";

import { X, Clock, Bell, Loader2, ShoppingCart, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  useAdminNotifications,
  useMarkAdminNotificationRead,
  useMarkAllAdminNotificationsRead,
  useRealtimeAdminNotifications,
  formatRelativeTime,
  getNotificationTypeLabel,
} from "@/hooks/useRealtimeAdminNotifications";

import type { AdminNotification, OrderNotificationMetadata } from "./types";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: AdminNotification;
  onMarkRead: (id: string) => void;
  onClick: (notification: AdminNotification) => void;
}) {
  const typeInfo = getNotificationTypeLabel(notification.type);
  const metadata = notification.metadata as OrderNotificationMetadata | null;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    onClick(notification);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
        !notification.is_read ? "bg-blue-50/50" : ""
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            notification.type === "order"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
              )}
              <span
                className={`text-sm truncate ${
                  !notification.is_read
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground"
                }`}
              >
                {notification.title}
              </span>
            </div>
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>

          {notification.body && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{notification.body}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            {metadata?.user_name && (
              <span className="text-xs text-muted-foreground">{metadata.user_name}</span>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{formatRelativeTime(notification.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useAdminNotifications();
  const markReadMutation = useMarkAdminNotificationRead();
  const markAllReadMutation = useMarkAllAdminNotificationsRead();

  // Subscribe to realtime updates
  useRealtimeAdminNotifications();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    const metadata = notification.metadata as OrderNotificationMetadata | null;
    if (notification.type === "order" && metadata?.order_id) {
      onClose();
      router.push(`/orders/${metadata.order_id}`);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[400px] max-h-[600px] bg-background border rounded-lg shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Мэдэгдэл</h2>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {unreadCount} шинэ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Бүгдийг уншсан
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Мэдэгдэл байхгүй байна</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="border-t p-2">
          <button
            onClick={() => {
              onClose();
              router.push("/notifications");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Бүх мэдэгдэл харах
          </button>
        </div>
      )}
    </div>
  );
}
