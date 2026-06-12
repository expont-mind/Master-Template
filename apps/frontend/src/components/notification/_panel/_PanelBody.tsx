"use client";

import { NotificationItem } from "@/components/notification/NotificationItem";
import { StatusChangeItem } from "@/components/notification/StatusChangeItem";
import { Spinner } from "@/components/ui/Spinner";

import { BellIcon } from "./_BellIcon";

import type { CombinedNotification } from "@/lib/hooks/useNotifications";

interface PanelBodyProps {
  isLoading: boolean;
  userId: string | undefined;
  notifications: CombinedNotification[];
  variant: "mobile" | "desktop";
  onMarkRead: (id: string) => void;
  onMarkStatusChangeRead: (id: string) => void;
  onClose: () => void;
}

function EmptyState({ message, variant }: { message: string; variant: "mobile" | "desktop" }) {
  const padding = variant === "mobile" ? "px-4" : "px-6";
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${padding} text-center`}>
      <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mb-4">
        <BellIcon />
      </div>
      <p className="text-text-secondary font-manrope text-sm">{message}</p>
    </div>
  );
}

function LoginPrompt({ variant }: { variant: "mobile" | "desktop" }) {
  const padding = variant === "mobile" ? "px-4" : "px-6";
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${padding} text-center`}>
      <p className="text-text-secondary font-manrope text-sm">Мэдэгдэл харахын тулд нэвтэрнэ үү</p>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkRead,
  onMarkStatusChangeRead,
  onClose,
}: Pick<PanelBodyProps, "notifications" | "onMarkRead" | "onMarkStatusChangeRead" | "onClose">) {
  return (
    <>
      {notifications.map((notification) =>
        notification.type === "status_change" ? (
          <StatusChangeItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkStatusChangeRead}
            onClose={onClose}
          />
        ) : (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
            onClose={onClose}
          />
        ),
      )}
    </>
  );
}

export function PanelBody(props: PanelBodyProps) {
  const { isLoading, userId, notifications, variant } = props;

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center py-20 ${
          variant === "mobile" ? "px-4" : "px-6"
        }`}
      >
        <Spinner size="md" />
      </div>
    );
  }
  if (!userId) {
    return <LoginPrompt variant={variant} />;
  }
  if (notifications.length === 0) {
    return <EmptyState message="Мэдэгдэл байхгүй байна" variant={variant} />;
  }
  return <NotificationList {...props} />;
}
