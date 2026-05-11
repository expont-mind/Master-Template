"use client";

import { BRAND } from "@/lib/utils/brand-config";
import Image from "next/image";
import { Truck, MPointBadge } from "@/components/svg";
import { type CartItem, formatPrice } from "@/components/checkout/constants";
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
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.salePrice) * item.quantity,
    0,
  );
  const totalPayable =
    subtotal - totalDiscount - couponDiscount - pointDiscount + deliveryFee;

  return (
    <div className="w-full md:w-[342px] shrink-0 flex flex-col gap-4 md:gap-8 pt-4 md:pt-0">
      <div className="flex flex-col gap-4 md:gap-8 pb-4 md:pb-0">
        <p className="hidden md:block text-[#020617] font-medium text-xl font-manrope">
          Төлбөрийн мэдээлэл
        </p>

        <div className="flex flex-col gap-3 md:gap-4">
          {/* Product Thumbnails - desktop only */}
          <div className="hidden md:flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[55px] h-[55px] rounded-sm border border-[#E2E8F0] skeleton shrink-0 overflow-hidden"
                  />
                ))}
              </>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="w-[55px] h-[55px] rounded-sm border border-[#E2E8F0] bg-[#F1F5F9] shrink-0 overflow-hidden relative"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="55px"
                      quality={75}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Divider - desktop only */}
          <div className="hidden md:block py-2">
            <div className="w-full h-px bg-[#E2E8F0]" />
          </div>

          {/* Total to Pay */}
          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-bold md:font-semibold text-base md:text-lg font-manrope">
              Нийт төлөх дүн
            </p>
            <p className="text-[#020617] font-bold md:font-semibold text-base md:text-lg font-manrope">
              {formatPrice(totalPayable)} ₮
            </p>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal md:font-normal text-sm md:text-base font-manrope">
                Үнийн дүн ({totalCount}ш)
              </p>
              <p className="text-[#020617] font-medium text-sm md:text-base font-manrope">
                {formatPrice(subtotal)} ₮
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm md:text-base font-manrope">
                Нийт хэмнэсэн
              </p>
              <p className="text-[#F43F5E] font-medium text-sm md:text-base font-manrope">
                -{formatPrice(totalDiscount + couponDiscount + pointDiscount)} ₮
              </p>
            </div>

            {/* Indented breakdown */}
            <div className="flex flex-col gap-2 pl-6">
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope">
                  Хэмнэсэн
                </p>
                <p className="text-[#F43F5E] font-normal text-sm md:text-base font-manrope">
                  -{formatPrice(totalDiscount)} ₮
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope">
                  {BRAND.name} point
                </p>
                <div className="flex items-center text-[#F43F5E] font-normal text-sm md:text-base font-manrope">
                  <span>-{pointDiscount.toLocaleString()}</span>{" "}
                  <MPointBadge className="ml-[2px]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope">
                  Купон
                </p>
                <p className="text-[#F43F5E] font-normal text-sm md:text-base font-manrope">
                  -{formatPrice(couponDiscount)} ₮
                </p>
              </div>
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-normal text-sm md:text-base font-manrope underline underline-offset-[3.8px]">
                Хүргэлт
              </p>
              <p className="font-normal text-sm md:text-base font-manrope text-[#020617]">
                {!deliveryFeeResolved
                  ? "Тооцоолж байна..."
                  : deliveryFee === 0
                    ? "Үнэгүй"
                    : `${formatPrice(deliveryFee)} ₮`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        disabled={!canPay || syncing}
        onClick={canPay && !syncing ? onPayment : undefined}
        className={`w-full h-14 md:h-auto md:py-2.5 px-3 rounded-sm font-normal text-lg md:text-base font-manrope transition-colors duration-200 flex items-center justify-center gap-2 ${
          canPay && !syncing
            ? "bg-[#020617] text-white cursor-pointer hover:bg-[#1E293B]"
            : "bg-[rgba(2,6,23,0.30)] text-white cursor-not-allowed"
        }`}
      >
        {syncing ? "Уншиж байна..." : totalPayable === 0 ? "Захиалга баталгаажуулах" : "Төлбөр төлөх"}
      </button>

      {/* Delivery Info */}
      <div className="flex items-center gap-4 px-4 py-5 bg-[#F8FAFC] md:bg-[#F8FAFC] rounded-[10px]">
        <div className="shrink-0">
          <Truck />
        </div>
        <p className="text-[#020617] font-medium text-base font-manrope leading-6">
          Хот дотор{" "}
          {ubZone
            ? `${ubZone.estimated_days_min}-${ubZone.estimated_days_max}`
            : "1-5"}{" "}
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
