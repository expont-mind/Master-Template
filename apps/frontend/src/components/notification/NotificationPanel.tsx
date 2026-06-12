"use client";

import { SITE } from "@repo/config-site";
import { useEffect, useRef, useState, type RefObject } from "react";

import {
  useCombinedNotifications,
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkStatusChangeRead,
} from "@/lib/hooks/useNotifications";

import { PanelBody } from "./_panel/_PanelBody";
import { PanelHeader } from "./_panel/_PanelHeader";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  anchorRef?: RefObject<HTMLDivElement | null>;
}

function useAnchoredPosition(
  isOpen: boolean,
  anchorRef: RefObject<HTMLDivElement | null> | undefined,
) {
  const [position, setPosition] = useState({ top: 0, right: 0 });
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);
  return position;
}

function useDismissOnEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);
}

function useDismissOnOutsideClick(
  isOpen: boolean,
  onClose: () => void,
  panelRefs: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideAny = panelRefs.some((ref) => ref.current?.contains(target));
      if (!insideAny) onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, panelRefs]);
}

// Wrapper/inner split: when notifications are disabled, no hooks run, no
// notification queries fire, and no realtime subscriptions are opened.
export function NotificationPanel(props: NotificationPanelProps) {
  if (!SITE.features.notifications) return null;
  return <NotificationPanelInner {...props} />;
}

function NotificationPanelInner({ isOpen, onClose, userId, anchorRef }: NotificationPanelProps) {
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(isOpen, anchorRef);
  const { notifications, isLoading } = useCombinedNotifications(userId);
  const markReadMutation = useMarkNotificationRead();
  const markStatusChangeReadMutation = useMarkStatusChangeRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteAllMutation = useDeleteAllNotifications();

  const hasNotifications = notifications.length > 0;
  const hasUnread = notifications.some((n) => !n.isRead);
  const isDeleting = deleteAllMutation.isPending;
  const isMarkingAllRead = markAllReadMutation.isPending;

  useDismissOnEscape(isOpen, onClose);
  useDismissOnOutsideClick(isOpen, onClose, [mobilePanelRef, desktopPanelRef]);

  const handleMarkAllRead = () => {
    if (userId) markAllReadMutation.mutate(userId);
  };
  const handleDeleteAll = () => {
    if (userId) deleteAllMutation.mutate(userId);
  };
  const handleMarkRead = (id: string) => markReadMutation.mutate(id);
  const handleMarkStatusChangeRead = (id: string) => markStatusChangeReadMutation.mutate(id);

  const headerProps = {
    userId,
    hasNotifications,
    hasUnread,
    isMarkingAllRead,
    isDeleting,
    onMarkAllRead: handleMarkAllRead,
    onDeleteAll: handleDeleteAll,
    onClose,
  };
  const bodyProps = {
    isLoading,
    userId,
    notifications,
    onMarkRead: handleMarkRead,
    onMarkStatusChangeRead: handleMarkStatusChangeRead,
    onClose,
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
        <PanelHeader {...headerProps} variant="mobile" />
        <div className="flex-1 overflow-y-auto">
          <PanelBody {...bodyProps} variant="mobile" />
        </div>
      </div>

      {/* Desktop: Positioned dropdown */}
      <div
        ref={desktopPanelRef}
        className={`fixed w-[441px] max-h-[720px] bg-white border border-border rounded-[10px] shadow-xl overflow-hidden z-100 hidden md:block transition duration-200 ease-out ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{
          top: position.top,
          right: position.right,
          boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <PanelHeader {...headerProps} variant="desktop" />
        <div className="pt-4">
          <div className="max-h-[580px] overflow-y-auto">
            <PanelBody {...bodyProps} variant="desktop" />
          </div>
        </div>
      </div>
    </>
  );
}
