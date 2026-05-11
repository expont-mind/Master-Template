"use client";

import Link from "next/link";
import { Clock } from "@/components/svg";
import type { CombinedNotification } from "@/lib/hooks/useNotifications";
import { formatRelativeTime } from "./utils";

interface NotificationItemProps {
  notification: CombinedNotification;
  onMarkRead?: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onClose) {
      onClose();
    }
  };

  const content = (
    <div className="flex gap-3">
      {/* Blue unread dot - positioned outside on mobile */}
      <div className="shrink-0 w-2 flex justify-center pt-2">
        {!notification.isRead && (
          <div className="w-[6px] h-[6px] rounded-full bg-[#3B82F6]" />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {/* Header row: Title and time */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-base md:text-sm font-manrope ${
              !notification.isRead
                ? "font-semibold text-[#020617]"
                : "font-medium text-[#020617]"
            }`}
          >
            {notification.title}
          </span>
          <div className="flex items-center gap-1 text-[#64748B] shrink-0">
            <Clock />
            <span className="text-xs font-manrope whitespace-nowrap">
              {formatRelativeTime(notification.timestamp)}
            </span>
          </div>
        </div>

        {/* Body text */}
        {notification.body && (
          <p className="text-sm text-[#64748B] font-manrope line-clamp-2">
            {notification.body}
          </p>
        )}
      </div>
    </div>
  );

  const baseClassName = `w-full text-left px-4 md:px-6 py-5 md:py-4 hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0 ${
    !notification.isRead ? "bg-[#F8FAFC]" : ""
  }`;

  // If there's an order ID, make it a link to the order page
  if (notification.orderId) {
    return (
      <Link
        href={`/profile?tab=orders&orderId=${notification.orderId}`}
        onClick={handleClick}
        className={`block ${baseClassName}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={baseClassName}>
      {content}
    </button>
  );
}
