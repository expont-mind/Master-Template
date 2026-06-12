"use client";

import Image from "next/image";

import { type CartItem, formatPrice } from "@/components/checkout/constants";
import { Truck, MPointBadge } from "@/components/svg";
import { BRAND } from "@/lib/utils/brand-config";

import type { SelectedCoupon } from "@/stores/cart-store";

interface PaymentSummaryProps {
  items: CartItem[];
  canPay: boolean;
  syncing: boolean;
  loading?: boolean;
  deliveryFee: number;
  deliveryFeeResolved?: boolean;
  onPayment: () => void;
  selectedCoupon?: SelectedCoupon | null;
  couponDiscount?: number;
  pointDiscount?: number;
  onCouponClick?: () => void;
  ubZone?: { estimated_days_min: number; estimated_days_max: number };
  regionalZone?: { estimated_days_min: number; estimated_days_max: number };
}

interface PaymentTotals {
  totalCount: number;
  subtotal: number;
  totalDiscount: number;
  totalPayable: number;
}

function computeTotals(
  items: CartItem[],
  couponDiscount: number,
  pointDiscount: number,
  deliveryFee: number,
): PaymentTotals {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.salePrice) * item.quantity,
    0,
  );
  const totalPayable = subtotal - totalDiscount - couponDiscount - pointDiscount + deliveryFee;
  return { totalCount, subtotal, totalDiscount, totalPayable };
}

function formatDeliveryFee(deliveryFee: number, deliveryFeeResolved: boolean): string {
  if (!deliveryFeeResolved) return "Тооцоолж байна...";
  if (deliveryFee === 0) return "Үнэгүй";
  return `${formatPrice(deliveryFee)} ₮`;
}

function ProductThumbnails({ items, loading }: { items: CartItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[55px] h-[55px] rounded-sm border border-border skeleton shrink-0 overflow-hidden"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="hidden md:flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
      {items.map((item) => (
        <div
          key={item.id}
          className="w-[55px] h-[55px] rounded-sm border border-border bg-border-light shrink-0 overflow-hidden relative"
        >
          {item.image && (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="55px"
              quality={90}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SavingsBreakdown({
  totalDiscount,
  couponDiscount,
  pointDiscount,
}: {
  totalDiscount: number;
  couponDiscount: number;
  pointDiscount: number;
}) {
  return (
    <div className="flex flex-col gap-2 pl-6">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">
          Хэмнэсэн
        </p>
        <p className="text-brand-primary font-normal text-sm md:text-base font-manrope">
          -{formatPrice(totalDiscount)} ₮
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">
          {BRAND.name} point
        </p>
        <div className="flex items-center text-brand-primary font-normal text-sm md:text-base font-manrope">
          <span>-{pointDiscount.toLocaleString()}</span> <MPointBadge className="ml-[2px]" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">Купон</p>
        <p className="text-brand-primary font-normal text-sm md:text-base font-manrope">
          -{formatPrice(couponDiscount)} ₮
        </p>
      </div>
    </div>
  );
}

export function PaymentSummary({
  items,
  canPay,
  syncing,
  loading = false,
  deliveryFee,
  deliveryFeeResolved = true,
  onPayment,
  couponDiscount = 0,
  pointDiscount = 0,
  ubZone,
  regionalZone,
}: PaymentSummaryProps) {
  const { totalCount, subtotal, totalDiscount, totalPayable } = computeTotals(
    items,
    couponDiscount,
    pointDiscount,
    deliveryFee,
  );

  const isInteractive = canPay && !syncing;
  const buttonText = syncing
    ? "Уншиж байна..."
    : totalPayable === 0
      ? "Захиалга баталгаажуулах"
      : "Төлбөр төлөх";

  return (
    <div className="w-full md:w-[342px] shrink-0 flex flex-col gap-4 md:gap-8 pt-4 md:pt-0">
      <div className="flex flex-col gap-4 md:gap-8 pb-4 md:pb-0">
        <p className="hidden md:block text-text-primary font-medium text-xl font-manrope">
          Төлбөрийн мэдээлэл
        </p>

        <div className="flex flex-col gap-3 md:gap-4">
          <ProductThumbnails items={items} loading={loading} />

          <div className="hidden md:block py-2">
            <div className="w-full h-px bg-border" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-text-primary font-bold md:font-semibold text-base md:text-lg font-manrope">
              Нийт төлөх дүн
            </p>
            <p className="text-text-primary font-bold md:font-semibold text-base md:text-lg font-manrope">
              {formatPrice(totalPayable)} ₮
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-text-primary font-normal md:font-normal text-sm md:text-base font-manrope">
                Үнийн дүн ({totalCount}ш)
              </p>
              <p className="text-text-primary font-medium text-sm md:text-base font-manrope">
                {formatPrice(subtotal)} ₮
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-text-primary font-normal text-sm md:text-base font-manrope">
                Нийт хэмнэсэн
              </p>
              <p className="text-brand-primary font-medium text-sm md:text-base font-manrope">
                -{formatPrice(totalDiscount + couponDiscount + pointDiscount)} ₮
              </p>
            </div>

            <SavingsBreakdown
              totalDiscount={totalDiscount}
              couponDiscount={couponDiscount}
              pointDiscount={pointDiscount}
            />

            <div className="flex items-center justify-between">
              <p className="text-text-primary font-normal text-sm md:text-base font-manrope underline underline-offset-[3.8px]">
                Хүргэлт
              </p>
              <p className="font-normal text-sm md:text-base font-manrope text-text-primary">
                {formatDeliveryFee(deliveryFee, deliveryFeeResolved)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        disabled={!isInteractive}
        onClick={isInteractive ? onPayment : undefined}
        className={`w-full h-14 md:h-auto md:py-2.5 px-3 rounded-sm font-normal text-lg md:text-base font-manrope transition-colors duration-200 flex items-center justify-center gap-2 ${
          isInteractive
            ? "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
            : "bg-text-primary/30 text-white cursor-not-allowed"
        }`}
      >
        {buttonText}
      </button>

      <div className="flex items-center gap-4 px-4 py-5 bg-surface md:bg-surface rounded-[10px]">
        <div className="shrink-0">
          <Truck />
        </div>
        <p className="text-text-primary font-medium text-base font-manrope leading-6">
          Хот дотор {ubZone ? `${ubZone.estimated_days_min}-${ubZone.estimated_days_max}` : "1-5"}{" "}
          хоногт, орон нутагт{" "}
          {regionalZone
            ? `${regionalZone.estimated_days_min}-${regionalZone.estimated_days_max}`
            : "3-7"}{" "}
          хоногт хүргэгдэнэ.
        </p>
      </div>
    </div>
  );
}
