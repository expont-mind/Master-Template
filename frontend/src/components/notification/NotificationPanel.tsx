"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Cancel } from "@/components/svg";
import { Spinner } from "@/components/ui/Spinner";
import { NotificationItem } from "./NotificationItem";
import { StatusChangeItem } from "./StatusChangeItem";
import {
  useCombinedNotifications,
  useMarkNotificationRead,
  useMarkStatusChangeRead,
  useMarkAllNotificationsRead,
  useDeleteAllNotifications,
} from "@/lib/hooks/useNotifications";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  anchorRef?: RefObject<HTMLDivElement | null>;
}

export function NotificationPanel({
  isOpen,
  onClose,
  userId,
  anchorRef,
}: NotificationPanelProps) {
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const { notifications, isLoading } = useCombinedNotifications(userId);
  const markReadMutation = useMarkNotificationRead();
  const markStatusChangeReadMutation = useMarkStatusChangeRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteAllMutation = useDeleteAllNotifications();

  const hasNotifications = notifications.length > 0;
  const hasUnread = notifications.some((n) => !n.isRead);
  const isDeleting = deleteAllMutation.isPending;
  const isMarkingAllRead = markAllReadMutation.isPending;

  // Calculate position based on anchor element
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const containerRight = window.innerWidth - rect.right;
      setPosition({
        top: rect.bottom + 8,
        right: containerRight,
      });
    }
  }, [isOpen, anchorRef]);

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
      const target = e.target as Node;
      const isInsideMobile = mobilePanelRef.current?.contains(target);
      const isInsideDesktop = desktopPanelRef.current?.contains(target);
      if (!isInsideMobile && !isInsideDesktop) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay adding the listener to prevent immediate close
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

  const handleMarkStatusChangeRead = (id: string) => {
    markStatusChangeReadMutation.mutate(id);
  };

  return (
    <>
      {/* Mobile: Slide down from top */}
      <div
        ref={mobilePanelRef}
        className={`fixed top-[44px] left-0 right-0 bottom-0 bg-white z-50 flex flex-col md:hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-5 border-b border-[#E2E8F0]">
          <h2 className="text-2xl font-bold text-[#020617] font-manrope">
            Мэдэгдэл
          </h2>
          <div className="flex items-center gap-3">
            {userId && hasNotifications && (
              <>
                {hasUnread && (
                  <button
                    onClick={() => markAllReadMutation.mutate(userId)}
                    disabled={isMarkingAllRead || isDeleting}
                    className="text-xs font-manrope text-[#64748B] hover:text-[#020617] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isMarkingAllRead && <Spinner size="sm" />}
                    Бүгдийг уншсан
                  </button>
                )}
                <button
                  onClick={() => deleteAllMutation.mutate(userId)}
                  disabled={isDeleting || isMarkingAllRead}
                  className="text-xs font-manrope text-[#EF4444] hover:text-[#DC2626] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting && <Spinner size="sm" />}
                  Бүгдийг устгах
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors"
              aria-label="Close"
            >
              <Cancel />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 px-4">
              <Spinner size="md" />
            </div>
          ) : !userId ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <p className="text-[#64748B] font-manrope text-sm">
                Мэдэгдэл харахын тулд нэвтэрнэ үү
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.52992 14.7696C2.31727 16.1636 3.268 17.1312 4.43205 17.6134C8.89481 19.4622 15.1052 19.4622 19.5679 17.6134C20.732 17.1312 21.6827 16.1636 21.4701 14.7696C21.3394 13.9129 20.6932 13.2075 20.2144 12.5017C19.5873 11.5959 19.525 10.6033 19.525 9.55238C19.525 5.3025 16.1559 1.84961 12 1.84961C7.84413 1.84961 4.47501 5.3025 4.47501 9.55238C4.47501 10.6033 4.41272 11.5959 3.78561 12.5017C3.30684 13.2075 2.66061 13.9129 2.52992 14.7696Z"
                    stroke="#94A3B8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 19C8.45849 20.7252 10.0755 22 12 22C13.9245 22 15.5415 20.7252 16 19"
                    stroke="#94A3B8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[#64748B] font-manrope text-sm">
                Мэдэгдэл байхгүй байна
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) =>
                notification.type === "status_change" ? (
                  <StatusChangeItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkStatusChangeRead}
                    onClose={onClose}
                  />
                ) : (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onClose={onClose}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Positioned dropdown */}
      <div
        ref={desktopPanelRef}
        className={`fixed w-[441px] max-h-[720px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-xl overflow-hidden z-100 hidden md:block transition duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{
          top: position.top,
          right: position.right,
          boxShadow:
            "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-xl font-semibold text-[#020617] font-manrope">
            Мэдэгдэл
          </h2>
          <div className="flex items-center gap-3">
            {userId && hasNotifications && (
              <>
                {hasUnread && (
                  <button
                    onClick={() => markAllReadMutation.mutate(userId)}
                    disabled={isMarkingAllRead || isDeleting}
                    className="text-xs font-manrope text-[#64748B] hover:text-[#020617] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isMarkingAllRead && <Spinner size="sm" />}
                    Бүгдийг уншсан
                  </button>
                )}
                <button
                  onClick={() => deleteAllMutation.mutate(userId)}
                  disabled={isDeleting || isMarkingAllRead}
                  className="text-xs font-manrope text-[#EF4444] hover:text-[#DC2626] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting && <Spinner size="sm" />}
                  Бүгдийг устгах
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors"
              aria-label="Close"
            >
              <Cancel />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 px-6">
              <Spinner size="md" />
            </div>
          ) : !userId ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <p className="text-[#64748B] font-manrope text-sm">
                Мэдэгдэл харахын тулд нэвтэрнэ үү
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.52992 14.7696C2.31727 16.1636 3.268 17.1312 4.43205 17.6134C8.89481 19.4622 15.1052 19.4622 19.5679 17.6134C20.732 17.1312 21.6827 16.1636 21.4701 14.7696C21.3394 13.9129 20.6932 13.2075 20.2144 12.5017C19.5873 11.5959 19.525 10.6033 19.525 9.55238C19.525 5.3025 16.1559 1.84961 12 1.84961C7.84413 1.84961 4.47501 5.3025 4.47501 9.55238C4.47501 10.6033 4.41272 11.5959 3.78561 12.5017C3.30684 13.2075 2.66061 13.9129 2.52992 14.7696Z"
                    stroke="#94A3B8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 19C8.45849 20.7252 10.0755 22 12 22C13.9245 22 15.5415 20.7252 16 19"
                    stroke="#94A3B8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[#64748B] font-manrope text-sm">
                Мэдэгдэл байхгүй байна
              </p>
            </div>
          ) : (
            <div className="max-h-[580px] overflow-y-auto">
              {notifications.map((notification) =>
                notification.type === "status_change" ? (
                  <StatusChangeItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkStatusChangeRead}
                    onClose={onClose}
                  />
                ) : (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onClose={onClose}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
