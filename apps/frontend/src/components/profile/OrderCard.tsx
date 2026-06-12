"use client";

import Link from "next/link";

import { TruckSmall, Calendar, Tag, More, ChevronRightProduct } from "@/components/svg";
import { useCanReviewAny } from "@/lib/hooks/useReviews";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice, parseAsUTC } from "@/lib/utils/formatters";
import { useWishlistStore } from "@/stores/wishlist-store";

import { isUnpaidStatus, resolveOrderBadge } from "./order/_orderStatusResolver";
import { useTransientMenu } from "./order/_useTransientMenu";
import { OrderCardItems } from "./order/OrderCardItems";

import type { ProfileOrder } from "@/app/profile/page";

interface OrderCardProps {
  order: ProfileOrder;
  onMoreClick?: () => void;
  onDelete?: () => void;
}

function formatDate(dateStr: string): string {
  const d = parseAsUTC(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  };
  const formatted = d.toLocaleDateString("en-CA", options);
  return formatted.replace(/-/g, ".");
}

function getOrderTotal(order: ProfileOrder, isPaymentUnpaid: boolean): number {
  if (!isPaymentUnpaid) return order.total_amount;
  return order.total_amount + (order.coupon_discount ?? 0) + (order.points_used ?? 0);
}

interface DeleteMenuProps {
  onDelete: () => void;
}

const DeleteMenu = ({ onDelete }: DeleteMenuProps) => {
  const { setIsMenuOpen, menuMounted, menuVisible, menuRef } = useTransientMenu();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen((prev) => !prev);
        }}
        className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-surface rounded transition-colors"
      >
        <More />
      </button>
      {menuMounted && (
        <div
          className={`absolute left-0 top-full mt-1 z-20 bg-white border border-border rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] min-w-[120px] p-1 origin-top-left transition-[opacity,transform] duration-150 ease-out ${
            menuVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              onDelete();
            }}
            className="w-full text-left px-2 py-1.5 text-sm text-text-primary font-normal font-manrope hover:bg-surface rounded transition-colors cursor-pointer"
          >
            Устгах
          </button>
        </div>
      )}
    </div>
  );
};

export const OrderCard = ({ order, onMoreClick, onDelete }: OrderCardProps) => {
  const isPaymentUnpaid = isUnpaidStatus(order.payment_status);
  const config = resolveOrderBadge(order.payment_status, order.delivery_status);
  const orderNumber = order.order_number
    ? `#${order.order_number}`
    : `#${order.id.slice(0, 8).toUpperCase()}`;
  const items = order.items ?? [];
  const userId = useWishlistStore((s) => s.userId);
  const productIds = items.map((item) => item.product_id);
  const { data: reviewableProductId } = useCanReviewAny(productIds, userId);
  const showReviewButton = order.delivery_status === "delivered" && !!reviewableProductId;

  const reviewableItem = reviewableProductId
    ? items.find((i) => i.product_id === reviewableProductId)
    : null;

  return (
    <div
      className={`bg-white border border-border rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.10)] px-3 pt-3 ${showReviewButton ? "pb-3" : "pb-1.5"} flex flex-col gap-4 cursor-pointer hover:border-border-strong transition-colors`}
      onClick={onMoreClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onMoreClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Захиалга ${orderNumber}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-0.5">
            <TruckSmall />
            <p className="text-text-primary font-semibold text-sm font-manrope leading-5">
              {orderNumber}
            </p>
          </div>
          <button
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick?.();
            }}
          >
            <span
              className={`${config.bg} ${config.text} font-medium text-xs font-manrope leading-4 px-1.5 pt-0.5 pb-1 rounded-[28px]`}
            >
              {config.label}
            </span>
            <ChevronRightProduct />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 px-0.5">
            <Calendar />
            <p className="text-text-secondary font-normal text-xs font-manrope leading-4">
              {formatDate(order.created_at)}
            </p>
          </div>
          <p className="text-text-secondary font-normal text-xs font-manrope leading-4">·</p>
          <div className="flex items-center gap-0.5 px-0.5">
            <Tag />
            <p className="text-text-secondary font-normal text-xs font-manrope leading-4">
              {items.length}ш
            </p>
          </div>
        </div>
      </div>

      {/* Items — collapsed to first 3; remainder animates open/closed via
           grid-template-rows trick (no JS height measurement needed). */}
      <OrderCardItems items={items} />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPaymentUnpaid && onDelete ? (
            <DeleteMenu onDelete={onDelete} />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick?.();
              }}
              className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-surface rounded transition-colors"
            >
              <More />
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-text-secondary font-normal text-xs font-manrope leading-4 mb-[3px]">
            Нийт дүн:
          </p>
          <span className="text-text-primary font-semibold text-base font-manrope leading-6">
            {formatPrice(getOrderTotal(order, isPaymentUnpaid))}
          </span>
        </div>
      </div>

      {showReviewButton && reviewableItem && (
        <div className="flex items-center justify-start">
          <Link
            href={ROUTES.PRODUCT(reviewableItem.products?.slug ?? reviewableProductId)}
            className="flex px-3 py-1 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="px-0.5">Үнэлгээ өгөх</span>
          </Link>
        </div>
      )}
    </div>
  );
};
