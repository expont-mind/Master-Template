"use client";

import { Cancel } from "@/components/svg";
import { Spinner } from "@/components/ui/Spinner";

interface PanelHeaderProps {
  userId: string | undefined;
  hasNotifications: boolean;
  hasUnread: boolean;
  isMarkingAllRead: boolean;
  isDeleting: boolean;
  variant: "mobile" | "desktop";
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onClose: () => void;
}

export function PanelHeader({
  userId,
  hasNotifications,
  hasUnread,
  isMarkingAllRead,
  isDeleting,
  variant,
  onMarkAllRead,
  onDeleteAll,
  onClose,
}: PanelHeaderProps) {
  const containerClass =
    variant === "mobile"
      ? "flex items-center justify-between px-4 pb-2 pt-5 border-b border-border"
      : "flex items-center justify-between p-6 pb-0";
  const titleClass =
    variant === "mobile"
      ? "text-2xl font-bold text-text-primary font-manrope"
      : "text-xl font-semibold text-text-primary font-manrope";

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>Мэдэгдэл</h2>
      <div className="flex items-center gap-3">
        {userId && hasNotifications && (
          <>
            {hasUnread && (
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={isMarkingAllRead || isDeleting}
                className="text-xs font-manrope text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isMarkingAllRead && <Spinner size="sm" />}
                Бүгдийг уншсан
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteAll}
              disabled={isDeleting || isMarkingAllRead}
              className="text-xs font-manrope text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isDeleting && <Spinner size="sm" />}
              Бүгдийг устгах
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-border-light rounded-lg transition-colors"
          aria-label="Close"
        >
          <Cancel />
        </button>
      </div>
    </div>
  );
}
