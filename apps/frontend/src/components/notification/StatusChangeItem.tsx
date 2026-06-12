"use client";

import Link from "next/link";

import { Clock, Calendar, Tag } from "@/components/svg";

import { formatRelativeTime, formatOrderDate, formatPrice, getShortOrderId } from "./utils";

import type { CombinedNotification } from "@/lib/hooks/useNotifications";

interface StatusChangeItemProps {
  notification: CombinedNotification;
  onMarkRead?: (id: string) => void;
  onClose?: () => void;
}

// Get status title label in Mongolian
function getStatusTitle(newStatus: string | undefined): string {
  switch (newStatus) {
    case "confirmed":
      return "Баталгаажсан";
    case "shipped":
      return "Хүргэлтэд гарсан";
    case "delivered":
      return "Хүргэгдсэн";
    case "canceled":
      return "Цуцлагдсан";
    case "paid":
      return "Төлбөр төлөгдсөн";
    case "failed":
      return "Төлбөр амжилтгүй";
    case "pending":
      return "Хүлээгдэж байна";
    default:
      return "Статус өөрчлөгдсөн";
  }
}

// Get description message in Mongolian
function getDescriptionMessage(
  newStatus: string | undefined,
  orderNumber: string | undefined,
): string {
  const shortId = orderNumber ? getShortOrderId(orderNumber) : "";
  switch (newStatus) {
    case "confirmed":
      return `Таны #${shortId} захиалга баталгаажлаа.`;
    case "shipped":
      return `Таны #${shortId} захиалга хүргэлтэд гарлаа.`;
    case "delivered":
      return `Таны #${shortId} захиалга хүргэгдлээ.`;
    case "canceled":
      return `Таны #${shortId} захиалга цуцлагдсан.`;
    case "paid":
      return `Таны #${shortId} захиалгын төлбөр төлөгдсөн.`;
    case "failed":
      return `Таны #${shortId} захиалгын төлбөр амжилтгүй.`;
    case "pending":
      return `Таны #${shortId} захиалга хүлээгдэж байна.`;
    default:
      return `Таны #${shortId} захиалгын статус өөрчлөгдсөн.`;
  }
}

export function StatusChangeItem({ notification, onMarkRead, onClose }: StatusChangeItemProps) {
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
        {!notification.isRead && <div className="w-[6px] h-[6px] rounded-full bg-blue-500" />}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {/* Header row: Status title and time */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-base md:text-sm font-manrope ${!notification.isRead ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}
          >
            {getStatusTitle(notification.newStatus)}
          </span>
          <div className="flex items-center gap-1 text-text-secondary shrink-0">
            <Clock />
            <span className="text-xs font-manrope whitespace-nowrap">
              {formatRelativeTime(notification.timestamp)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary font-manrope">
          {getDescriptionMessage(notification.newStatus, notification.orderNumber)}
        </p>

        {/* Order details: date · item count · total */}
        {(notification.orderDate || notification.orderItemsCount || notification.orderTotal) && (
          <div className="flex items-center gap-2 text-xs text-text-secondary font-manrope mt-0.5">
            {notification.orderDate && (
              <div className="flex items-center gap-1">
                <Calendar />
                <span>{formatOrderDate(notification.orderDate)}</span>
              </div>
            )}
            {notification.orderItemsCount !== undefined && (
              <>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Tag />
                  <span>{notification.orderItemsCount}ш</span>
                </div>
              </>
            )}
            {notification.orderTotal !== undefined && (
              <>
                <span>·</span>
                <span>{formatPrice(notification.orderTotal)}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const baseClassName = `w-full text-left px-4 md:px-6 py-5 md:py-4 hover:bg-surface transition-colors border-b border-border last:border-b-0 ${!notification.isRead ? "bg-surface" : ""}`;

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
