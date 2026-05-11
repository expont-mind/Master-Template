"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2 as Trash2Small } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  stripPhonePrefix,
  parseAsUTC,
} from "@/lib/utils/formatters";
import type { ProfileOrder } from "@/app/profile/page";
import type { Database } from "@/types/database";
import {
  Calendar,
  Tag,
  MoreVertical,
  More,
  LocationBig,
  Phone,
  PaymentRed,
  MPointBadge,
} from "../svg";
import { createClient } from "@/lib/supabase/client";
import { useCanReviewAny } from "@/lib/hooks/useReviews";
import { useWishlistStore } from "@/stores/wishlist-store";
import { PaymentModal, type OrderItemPayload } from "../checkout/PaymentModal";
import { createInvoiceForExistingOrder } from "../checkout/actions";
import type { QPayInvoiceData } from "@/lib/qpay/types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

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

interface OrderDetailViewProps {
  order: ProfileOrder;
  addresses: AddressRow[];
  user: UserRow | null;
  onBack: () => void;
  onRequestDelete?: () => void;
}

function formatDateTime(dateStr: string): string {
  const d = parseAsUTC(dateStr);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}  ${get("hour")}:${get("minute")}:${get("second")}`;
}

function formatDateShort(dateStr: string): string {
  const d = parseAsUTC(dateStr);
  return d
    .toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" })
    .replace(/-/g, ".");
}

export const OrderDetailView = ({
  order,
  addresses,
  user,
  onBack,
  onRequestDelete,
}: OrderDetailViewProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMenuOpen) {
      setMenuMounted(true);
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
  const orderNumber = order.order_number
    ? `#${order.order_number}`
    : `#${order.id.slice(0, 8).toUpperCase()}`;
  const items = order.items ?? [];
  const config =
    order.payment_status === "unpaid" || order.payment_status === "processing"
      ? { label: "Төлбөр хийгдээгүй", bg: "bg-rose-50", text: "text-rose-600" }
      : (deliveryStatusConfig[order.delivery_status ?? "pending"] ??
        deliveryStatusConfig.pending);
  const userId = useWishlistStore((s) => s.userId);
  const productIds = items.map((item) => item.product_id);
  const { data: reviewableProductId } = useCanReviewAny(productIds, userId);

  const defaultAddress =
    addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  // Point transactions for this order
  const [pointsUsed, setPointsUsed] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      const supabase = createClient() as any;
      const { data } = await supabase
        .from("point_transactions")
        .select("type, amount")
        .eq("order_id", order.id);
      if (data) {
        for (const tx of data as { type: string; amount: number }[]) {
          if (tx.type === "used") setPointsUsed(Math.abs(tx.amount));
          if (tx.type === "earned") setPointsEarned(tx.amount);
        }
      }
    };
    fetchPoints();
  }, [order.id]);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<QPayInvoiceData | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [retryTotalAmount, setRetryTotalAmount] = useState<number | null>(null);

  const handlePaymentClick = async () => {
    setIsCreatingInvoice(true);
    setCreateError(null);
    setIsPaymentModalOpen(true);

    const result = await createInvoiceForExistingOrder(order.id);

    if (result.success && result.data) {
      setInvoiceData(result.data.invoice);
      setRetryTotalAmount(result.data.totalAmount);
    } else {
      setCreateError(
        result.error || "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа",
      );
    }

    setIsCreatingInvoice(false);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // Refresh the page to show updated order status
    window.location.reload();
  };

  const orderItemsPayload: OrderItemPayload[] = items.map((item) => ({
    productId: item.product_id,
    name: item.products?.name ?? "Бүтээгдэхүүн",
    price: item.price,
    quantity: item.quantity,
    variantId: null,
    variantName: item.variant_name,
  }));

  // Payment status
  const isPaymentUnpaid =
    order.payment_status === "unpaid" || order.payment_status === "processing";
  const isPaymentPaid = order.payment_status === "paid";

  // Progress steps
  const isOrderConfirmed = order.payment_status === "paid";
  const deliveryStatus = order.delivery_status;
  const isDeliveryVisible =
    isOrderConfirmed &&
    isPaymentPaid &&
    deliveryStatus &&
    deliveryStatus !== "pending";
  const isDelivered = deliveryStatus === "delivered";

  const deliveryStatusLabels: Record<string, string> = {
    pending: "Хүргэлт хүлээгдэж буй",
    confirmed: "Хүргэлт баталгаажсан",
    shipped: "Хүргэлтэнд гарсан",
    delivered: "Хүргэгдсэн",
    cancelled: "Цуцлагдсан",
  };

  const steps = [
    {
      label: "Захиалга үүссэн",
      completed: true,
      isDelivered: false,
      timestamp: formatDateTime(order.created_at),
    },
    {
      label: "Төлбөр баталгаажуулах",
      completed: isPaymentPaid,
      isDelivered: false,
      timestamp: isPaymentPaid ? formatDateTime(order.created_at) : null,
    },
    {
      label:
        isDeliveryVisible && deliveryStatus
          ? (deliveryStatusLabels[deliveryStatus] ?? "Бараа хүргэх")
          : "Бараа хүргэх",
      completed: isDelivered,
      isDelivered: isDelivered,
      timestamp:
        isDelivered && order.updated_at
          ? formatDateTime(order.updated_at)
          : null,
    },
  ];

  // Find the first incomplete step index (the "next" step)
  const nextStepIndex = steps.findIndex((s) => !s.completed);

  // Price calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (item.products?.price ?? item.price) * item.quantity,
    0,
  );
  const totalDiscount = items.reduce((sum, item) => {
    const originalPrice = item.products?.price ?? item.price;
    return sum + (originalPrice - item.price) * item.quantity;
  }, 0);
  const couponDiscount = (isPaymentUnpaid || retryTotalAmount) ? 0 : (order.coupon_discount ?? 0);
  const displayTotal = retryTotalAmount ?? (isPaymentUnpaid
    ? (order.total_amount + (order.coupon_discount ?? 0) + (order.points_used ?? 0))
    : order.total_amount);
  const itemsTotal = subtotal - totalDiscount - couponDiscount;
  // For paid orders, total_amount has points deducted, so add them back to derive correct delivery fee
  // For unpaid orders, displayTotal already includes full price (points added back), so no adjustment
  const paidPointsAdjust = (isPaymentUnpaid || retryTotalAmount) ? 0 : (order.points_used ?? 0);
  const deliveryFee = Math.max(0, displayTotal + paidPointsAdjust - itemsTotal);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // User display name
  const userName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : "";

  return (
    <div className="flex flex-col gap-2">
      {/* Breadcrumb */}
      <div className="flex flex-col px-0.5 pb-2 md:pb-3 pt-5 md:pt-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBack}
            className="text-[#64748B] font-normal text-sm font-manrope leading-5 hover:text-[#020617] cursor-pointer transition-colors"
          >
            Миний захиалгууд
          </button>
          <span className="text-[#94A3B8] font-normal text-sm font-manrope">
            /
          </span>
          <span className="text-[#020617] font-normal text-sm font-manrope leading-5">
            {orderNumber}
          </span>
        </div>
        <p className="text-[#020617] font-semibold text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
          [{orderNumber}] Захиалгын дэлгэрэнгүй
        </p>
      </div>

      {/* Order Progress */}
      <div className="flex flex-col gap-6 px-0.5">
        <div className="flex items-center justify-between">
          <p className="text-[#020617] font-medium text-base font-manrope leading-6">
            Захиалгын явц
          </p>

          <div className="flex items-center gap-2">
            <span
              className={`${config.bg} ${config.text} font-medium text-xs font-manrope leading-4 px-1.5 pt-0.5 pb-1 rounded-[28px]`}
            >
              {config.label}
            </span>
            {isPaymentUnpaid && onRequestDelete && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#F8FAFC] rounded transition-colors"
                  aria-label="Цааш"
                >
                  <More />
                </button>
                {menuMounted && (
                  <div
                    className={`absolute right-0 top-full mt-1 z-20 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] min-w-[120px] p-1 origin-top-right transition-[opacity,transform] duration-150 ease-out ${
                      menuVisible
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-1"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRequestDelete();
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm text-[#020617] font-normal font-manrope hover:bg-[#F8FAFC] rounded transition-colors cursor-pointer"
                    >
                      Устгах
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Warning Card */}
        {isPaymentUnpaid && (
          <div className="border border-[#E2E8F0] rounded-[10px] sm:rounded-sm overflow-hidden">
            <div className="flex flex-col px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-4">
            {/* Mobile: title + body + icon/button row */}
            <div className="flex flex-col sm:hidden">
              <p className="text-[#E11D48] font-medium text-sm font-manrope leading-5">
                Төлбөр хийгдээгүй
              </p>
              <p className="text-[#E11D48] font-normal text-sm font-manrope leading-5 mt-0.5">
                Та дансны гүйлгээгээ ахин шалгаж, төлбөрөө гүйцээж, захиалгаа
                баталгаажуулна уу.
              </p>
              <div className="flex items-center justify-between mt-6">
                <PaymentRed />
                <button
                  onClick={handlePaymentClick}
                  className="px-3 py-1 bg-slate-950 rounded-md text-white font-normal text-sm font-manrope transition-colors cursor-pointer"
                >
                  <span className="px-0.5">Төлбөр төлөх</span>
                </button>
              </div>
            </div>
            {/* Desktop: icon + text | button */}
            <div className="hidden sm:flex sm:items-center sm:gap-6">
              <div className="shrink-0">
                <PaymentRed />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[#DC2626] font-medium text-sm font-manrope leading-5">
                  Төлбөр хийгдээгүй
                </p>
                <p className="text-[#DC2626] font-normal text-sm font-manrope leading-5">
                  Та дансны гүйлгээгээ ахин шалгаж, төлбөрөө гүйцээж, захиалгаа
                  баталгаажуулна уу.
                </p>
              </div>
            </div>
            <button
              onClick={handlePaymentClick}
              className="hidden sm:block shrink-0 px-3 py-1 bg-slate-950 rounded-sm text-white font-normal text-base font-manrope transition-colors cursor-pointer"
            >
              <span className="px-0.5">Төлбөр төлөх</span>
            </button>
            </div>
            {onRequestDelete && (
              <>
                <div className="h-px bg-[#E2E8F0]" />
                <button
                  onClick={onRequestDelete}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[#E11D48] font-medium text-sm font-manrope hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2Small className="w-4 h-4" />
                  Захиалга устгах
                </button>
              </>
            )}
          </div>
        )}

        {/* Timeline Steps */}
        <div className="flex flex-col gap-1.5 sm:gap-0 pb-4">
          {steps.map((step, index) => {
            const state: "completed" | "next" | "future" = step.completed
              ? "completed"
              : index === nextStepIndex
                ? "next"
                : "future";

            // Split timestamp "yyyy/MM/dd  HH:mm:ss" into date and time
            const tsParts = (step.timestamp ?? "").split(/\s{2,}/);
            const date = tsParts[0] || "–";
            const time = tsParts.length > 1 ? tsParts[1] : "–";

            // Icon per state
            const icon =
              state === "completed" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33398 9.33203L5.66732 11.6654L12.6673 4.33203"
                    stroke={step.isDelivered ? "#0d9488" : "#64748B"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : state === "next" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4V8L10 10"
                    stroke="#020617"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="#020617"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full border-[1.5px] border-[#94A3B8]" />
              );

            // Text style per state
            const labelClass =
              state === "completed"
                ? step.isDelivered
                  ? "text-teal-600 text-sm font-normal"
                  : "text-[#64748B] text-sm font-normal"
                : state === "next"
                  ? "text-[#020617] text-sm font-medium"
                  : "text-[#94A3B8] text-sm font-normal";

            const tsClass =
              state === "completed"
                ? step.isDelivered
                  ? "text-teal-600 text-sm font-normal"
                  : "text-[#64748B] text-sm font-normal"
                : state === "next"
                  ? "text-[#020617] text-sm font-normal"
                  : "text-[#94A3B8] text-sm font-normal";

            const dashClass = "text-[#94A3B8] text-sm font-normal";

            return (
              <div key={step.label} className="flex flex-col gap-1.5 sm:gap-0">
                {/* Icon + label + date + time in one row */}
                <div className="flex items-center">
                  <div className="w-4 h-4 flex items-center justify-center shrink-0 mr-1.5">
                    {icon}
                  </div>
                  <div className="flex-1 flex items-center justify-between min-h-[24px]">
                    <p className={`font-manrope leading-5 ${labelClass}`}>
                      {step.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-manrope leading-5 ${date === "–" ? dashClass : tsClass}`}
                      >
                        {date}
                      </p>
                      <p
                        className={`font-manrope leading-5 ${time === "–" ? dashClass : tsClass}`}
                      >
                        {time}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Connector below */}
                {index < steps.length - 1 && (
                  <div className="w-4 flex justify-center">
                    <MoreVertical />
                  </div>
                )}
              </div>
            );
          })}
          {order.delivery_status === "delivered" &&
            reviewableProductId &&
            (() => {
              const reviewableItem = items.find(
                (i) => i.product_id === reviewableProductId,
              );
              return (
                <div className="flex items-center justify-start pl-5 pt-4">
                  <Link
                    href={`/products/${reviewableItem?.products?.slug ?? reviewableProductId}`}
                    className="flex px-3 py-2.5 bg-[#020617] rounded-md cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
                  >
                    <span className="px-0.5">Үнэлгээ өгөх</span>
                  </Link>
                </div>
              );
            })()}
        </div>

        {/* Delivery Address */}
        {defaultAddress && (
          <div className="flex flex-col gap-4">
            <p className="text-[#020617] font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
              Хүргэх хаяг
            </p>
            <div className="border border-[#E2E8F0] rounded-sm p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-6">
              <div className="shrink-0 hidden sm:block">
                <LocationBig />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <p className="text-[#020617] font-bold text-sm sm:text-base font-manrope leading-5 sm:leading-6">
                    {defaultAddress.name}
                  </p>
                  {defaultAddress.is_default && (
                    <span className="bg-[#F1F5F9] text-[#020617] font-bold text-xs font-manrope px-2 py-0.5 rounded">
                      Үндсэн
                    </span>
                  )}
                </div>
                <p className="text-[#64748B] font-medium text-sm sm:text-base font-manrope leading-5 sm:leading-6">
                  {[
                    defaultAddress.city,
                    defaultAddress.district,
                    defaultAddress.sub_district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {defaultAddress.detail && (
                  <p className="text-[#020617] font-medium text-base sm:text-lg font-manrope leading-6 sm:leading-7">
                    {defaultAddress.detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        {user && (
          <div className="flex flex-col gap-4">
            <p className="text-[#020617] font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
              Холбоо барих
            </p>
            <div className="border border-[#E2E8F0] rounded-sm p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-6">
              <div className="shrink-0 hidden sm:block">
                <Phone />
              </div>
              <div className="flex flex-col">
                <p className="text-[#64748B] font-medium text-sm sm:text-base font-manrope leading-5 sm:leading-6">
                  {userName || "—"}
                </p>
                <p className="text-[#020617] font-medium text-base sm:text-lg font-manrope leading-6 sm:leading-7">
                  {[user.primary_phone, user.secondary_phone]
                    .filter(Boolean)
                    .map((p) => stripPhonePrefix(p!))
                    .join(" · ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Items */}
        <div className="flex flex-col gap-4">
          <p className="text-[#020617] font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
            Худалдан авалт
          </p>

          {/* Date and item count */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Calendar />
              <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
                {formatDateShort(order.created_at)}
              </p>
            </div>
            <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
              ·
            </p>
            <div className="flex items-center gap-0.5">
              <Tag />
              <p className="text-[#64748B] font-normal text-xs font-manrope leading-4">
                {items.length}ш
              </p>
            </div>
          </div>

          {/* Items list */}
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const originalPrice = item.products?.price ?? item.price;
              const hasDiscount = item.price < originalPrice;

              return (
                <Link
                  key={item.id}
                  href={`/products/${item.products?.slug ?? item.product_id}`}
                  className="flex gap-3 sm:gap-10 items-start"
                >
                  <div className="flex-1 flex gap-2 items-start">
                    <div className="w-[60px] h-[60px] sm:w-[76px] sm:h-[76px] rounded-[4px] border border-[#F1F5F9] bg-[#F8FAFC] shrink-0 overflow-hidden relative">
                      {item.products?.images?.[0] && (
                        <Image
                          src={item.products.images[0]}
                          alt={item.products.name ?? ""}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 60px, 76px"
                          quality={75}
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <p className="text-[#020617] font-normal text-sm font-manrope leading-5 line-clamp-2 hover:underline">
                        {item.products?.name ?? "Бүтээгдэхүүн"}
                      </p>
                      {item.variant_name && (
                        <p className="text-[#64748B] font-normal text-xs font-manrope leading-4 truncate py-0.5">
                          {item.variant_name}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <p className="text-[#020617] font-medium text-xs font-manrope leading-5 tracking-[-0.48px]">
                          {formatPrice(item.price)}
                        </p>
                        {hasDiscount && (
                          <p className="text-[#94A3B8] font-normal text-xs font-manrope leading-4 line-through">
                            {formatPrice(originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 pr-1 text-[#020617] font-normal text-sm font-manrope leading-5">
                    <span>{item.quantity}</span>
                    <span>x</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-[#E2E8F0]" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Total to Pay */}
          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-semibold text-base sm:text-lg font-manrope leading-6 sm:leading-7">
              Нийт төлсөн дүн
            </p>
            <p className="text-[#020617] font-semibold text-base sm:text-lg font-manrope leading-6 sm:leading-7">
              {formatPrice(displayTotal)}
            </p>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5">
                Үнийн дүн ({totalCount}ш)
              </p>
              <p className="text-[#020617] font-medium text-sm sm:text-base font-manrope leading-5">
                {formatPrice(subtotal)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5">
                Нийт хэмнэсэн
              </p>
              <p className="text-[#F43F5E] font-medium text-sm sm:text-base font-manrope leading-5">
                -{formatPrice(totalDiscount + couponDiscount + ((isPaymentUnpaid || retryTotalAmount) ? 0 : pointsUsed))}
              </p>
            </div>

            {/* Indented breakdown */}
            <div className="flex flex-col gap-2 pl-6">
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm sm:text-base font-manrope leading-5">
                  Хэмнэсэн
                </p>
                <p className="text-[#F43F5E] font-medium text-sm sm:text-base font-manrope leading-5">
                  -{formatPrice(totalDiscount)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm sm:text-base font-manrope leading-5">
                  Купон
                </p>
                <p className="text-[#F43F5E] font-medium text-sm sm:text-base font-manrope leading-5">
                  -{formatPrice(couponDiscount)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm sm:text-base font-manrope leading-5">
                  Monpang point
                </p>
                <p className="text-[#F43F5E] font-medium text-sm sm:text-base font-manrope leading-5 flex items-center gap-0.5">
                  -{((isPaymentUnpaid || retryTotalAmount) ? 0 : pointsUsed).toLocaleString()}
                  <MPointBadge />
                </p>
              </div>
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5 underline underline-offset-[3.8px]">
                Хүргэлт
              </p>
              <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-[#020617]">
                {formatPrice(deliveryFee)}
              </p>
            </div>

            {/* Coupon */}
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5">
                Миний купон
              </p>
              <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-[#020617]">
                {order.coupon_code ?? "—"}
              </p>
            </div>

            {/* Payment Wallet */}
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5">
                Төлбөрийн хэрэгсэл
              </p>
              <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-[#020617]">
                {order.payment_wallet ?? "—"}
              </p>
            </div>

            {/* Points earned */}
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm sm:text-base font-manrope leading-5">
                Monpang point
              </p>
              <p className="text-teal-600 font-medium text-sm sm:text-base font-manrope leading-5 flex items-center gap-0.5">
                +{pointsEarned.toLocaleString()}
                <MPointBadge />
              </p>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={retryTotalAmount ?? order.total_amount}
        invoiceData={invoiceData}
        lendmnInvoiceData={null}
        storepayInvoiceData={null}
        paymentMethod="qpay"
        isCreating={isCreatingInvoice}
        createError={createError}
        orderItems={orderItemsPayload}
        orderNumber={order.order_number}
        orderId={order.id}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
