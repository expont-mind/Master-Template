"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, parseAsUTC } from "@/lib/utils/formatters";
import type { ProfileOrder } from "@/app/profile/page";
import { TruckSmall, Calendar, Tag, More, ChevronRightProduct, ChevronDown } from "../svg";
import { useCanReviewAny } from "@/lib/hooks/useReviews";
import { useWishlistStore } from "@/stores/wishlist-store";

interface OrderCardProps {
  order: ProfileOrder;
  onMoreClick?: () => void;
  onDelete?: () => void;
}

const deliveryStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Баталгаажсан",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  confirmed: {
    label: "Баталгаажсан",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
  },
  shipped: {
    label: "Хүргэлтэнд гарсан",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
  },
  delivered: {
    label: "Хүргэгдсэн",
    bg: "bg-[#F0FDFA]",
    text: "text-[#0D9488]",
  },
  cancelled: {
    label: "Цуцлагдсан",
    bg: "bg-[#FFF1F2]",
    text: "text-[#E11D48]",
  },
};

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

const COLLAPSED_ITEM_COUNT = 3;

export const OrderCard = ({ order, onMoreClick, onDelete }: OrderCardProps) => {
  // Three states for smooth open/close: requested (intent) drives mount and
  // visibility separately so we can play an exit transition before unmount.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Coordinate mount/unmount with the 150ms transition.
  useEffect(() => {
    if (isMenuOpen) {
      setMenuMounted(true);
      // Double-rAF: ensures the element is painted in its initial state
      // before the visible class is applied, so the transition actually fires.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setMenuVisible(false);
    const timer = setTimeout(() => setMenuMounted(false), 150);
    return () => clearTimeout(timer);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!menuMounted) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuMounted]);

  const isPaymentUnpaid =
    order.payment_status === "unpaid" || order.payment_status === "processing";
  const config = isPaymentUnpaid
    ? { label: "Төлбөр хийгдээгүй", bg: "bg-rose-50", text: "text-rose-600" }
    : deliveryStatusConfig[order.delivery_status ?? "pending"] ??
      deliveryStatusConfig.pending;
  const orderNumber = order.order_number
    ? `#${order.order_number}`
    : `#${order.id.slice(0, 8).toUpperCase()}`;
  const items = order.items ?? [];
  const userId = useWishlistStore((s) => s.userId);
  const productIds = items.map((item) => item.product_id);
  const { data: reviewableProductId } = useCanReviewAny(productIds, userId);
  const showReviewButton = order.delivery_status === "delivered" && !!reviewableProductId;

  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.10)] px-3 pt-3 ${showReviewButton ? "pb-3" : "pb-1.5"} flex flex-col gap-4 cursor-pointer hover:border-[#CBD5E1] transition-colors`}
      onClick={onMoreClick}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-0.5">
            <TruckSmall />
            <p className="text-[#020617] font-semibold text-sm font-manrope leading-5">
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
            <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
              {formatDate(order.created_at)}
            </p>
          </div>
          <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
            ·
          </p>
          <div className="flex items-center gap-0.5 px-0.5">
            <Tag />
            <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
              {items.length}ш
            </p>
          </div>
        </div>
      </div>

      {/* Items — collapsed to first 3; remainder animates open/closed via
           grid-template-rows trick (no JS height measurement needed). */}
      {(() => {
        const renderItem = (item: typeof items[number]) => (
          <div
            key={item.id}
            className="flex gap-3 md:gap-10 items-start"
          >
            <div className="flex-1 flex gap-2 items-center min-w-0">
              <div className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] rounded-[4px] border border-[#F1F5F9] bg-[#F8FAFC] shrink-0 overflow-hidden relative">
                {item.products?.images?.[0] && (
                  <Image
                    src={item.products.images[0]}
                    alt={item.products.name ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 60px, 76px"
                    quality={75}
                  />
                )}
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <p className="text-[#020617] font-normal text-sm font-manrope leading-5 truncate">
                  {item.products?.name ?? "Бүтээгдэхүүн"}
                </p>
                {item.variant_name && (
                  <div className="flex items-center py-0.5">
                    <p className="text-[#64748B] font-normal text-xs font-manrope leading-4 truncate">
                      {item.variant_name}
                    </p>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <p className="text-[#020617] font-medium text-xs font-manrope leading-5 tracking-[-0.48px]">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 pr-1 text-[#020617] font-normal text-sm font-manrope leading-5">
              <span>{item.quantity}</span>
              <span>x</span>
            </div>
          </div>
        );

        const visibleItems = items.slice(0, COLLAPSED_ITEM_COUNT);
        const hiddenItems = items.slice(COLLAPSED_ITEM_COUNT);
        const hasMore = hiddenItems.length > 0;

        return (
          <div className="flex flex-col gap-3">
            {visibleItems.map(renderItem)}

            {hasMore && (
              // -mb-3 when collapsed cancels the parent flex's gap-3 to the
              // toggle button below, so the only visible spacing is the gap
              // *above* this wrapper. Without this, an empty 0-height row
              // still contributes two 12px gaps (24px total) on each side.
              <div
                className={`grid transition-all duration-300 ease-out ${
                  itemsExpanded
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr] -mb-3"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-3">
                    {hiddenItems.map(renderItem)}
                  </div>
                </div>
              </div>
            )}

            {hasMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setItemsExpanded((v) => !v);
                }}
                className="self-stretch flex items-center justify-center gap-1 px-3 py-2 border border-[#E2E8F0] rounded-sm text-[#020617] font-normal text-sm font-manrope hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <span>
                  {itemsExpanded
                    ? "Хураах"
                    : `Бүгдийг харах (${hiddenItems.length}+)`}
                </span>
                <span
                  className={`flex items-center justify-center transition-transform duration-300 ${
                    itemsExpanded ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown />
                </span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPaymentUnpaid && onDelete ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-[#F8FAFC] rounded transition-colors"
              >
                <More />
              </button>
              {menuMounted && (
                <div
                  className={`absolute left-0 top-full mt-1 z-20 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] min-w-[120px] p-1 origin-top-left transition-[opacity,transform] duration-150 ease-out ${
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
                    className="w-full text-left px-2 py-1.5 text-sm text-[#020617] font-normal font-manrope hover:bg-[#F8FAFC] rounded transition-colors cursor-pointer"
                  >
                    Устгах
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick?.();
              }}
              className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-[#F8FAFC] rounded transition-colors"
            >
              <More />
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-[#64748B] font-normal text-xs font-manrope leading-4 mb-[3px]">
            Нийт дүн:
          </p>
          <span className="text-text-primary font-semibold text-base font-manrope leading-6">
            {formatPrice(isPaymentUnpaid
              ? order.total_amount + (order.coupon_discount ?? 0) + (order.points_used ?? 0)
              : order.total_amount)}
          </span>
        </div>
      </div>

      {order.delivery_status === "delivered" && reviewableProductId && (() => {
        const reviewableItem = items.find((i) => i.product_id === reviewableProductId);
        return (
          <div className="flex items-center justify-start">
            <Link
              href={`/products/${reviewableItem?.products?.slug ?? reviewableProductId}`}
              className="flex px-3 py-1 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="px-0.5">Үнэлгээ өгөх</span>
            </Link>
          </div>
        );
      })()}
    </div>
  );
};
