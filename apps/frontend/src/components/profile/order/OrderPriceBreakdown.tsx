"use client";

import { MPointBadge } from "@/components/svg";
import { BRAND } from "@/lib/utils/brand-config";
import { formatPrice } from "@/lib/utils/formatters";

import { type OrderPricing } from "./_orderPricing";

interface OrderPriceBreakdownProps {
  pricing: OrderPricing;
  pointsEarned: number;
  couponCode: string | null;
  paymentWallet: string | null;
}

export const OrderPriceBreakdown = ({
  pricing,
  pointsEarned,
  couponCode,
  paymentWallet,
}: OrderPriceBreakdownProps) => {
  const {
    subtotal,
    totalDiscount,
    couponDiscount,
    displayTotal,
    deliveryFee,
    totalCount,
    effectivePointsUsed,
  } = pricing;

  return (
    <div className="flex flex-col gap-4">
      {/* Total to Pay */}
      <div className="flex items-center justify-between">
        <p className="text-text-primary font-semibold text-base sm:text-lg font-manrope leading-6 sm:leading-7">
          Нийт төлсөн дүн
        </p>
        <p className="text-text-primary font-semibold text-base sm:text-lg font-manrope leading-6 sm:leading-7">
          {formatPrice(displayTotal)}
        </p>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5">
            Үнийн дүн ({totalCount}ш)
          </p>
          <p className="text-text-primary font-medium text-sm sm:text-base font-manrope leading-5">
            {formatPrice(subtotal)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5">
            Нийт хэмнэсэн
          </p>
          <p className="text-brand-primary font-medium text-sm sm:text-base font-manrope leading-5">
            -{formatPrice(totalDiscount + couponDiscount + effectivePointsUsed)}
          </p>
        </div>

        {/* Indented breakdown */}
        <div className="flex flex-col gap-2 pl-6">
          <div className="flex items-center justify-between">
            <p className="text-text-secondary font-normal text-sm sm:text-base font-manrope leading-5">
              Хэмнэсэн
            </p>
            <p className="text-brand-primary font-medium text-sm sm:text-base font-manrope leading-5">
              -{formatPrice(totalDiscount)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-text-secondary font-normal text-sm sm:text-base font-manrope leading-5">
              Купон
            </p>
            <p className="text-brand-primary font-medium text-sm sm:text-base font-manrope leading-5">
              -{formatPrice(couponDiscount)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-text-secondary font-normal text-sm sm:text-base font-manrope leading-5">
              {BRAND.name} point
            </p>
            <p className="text-brand-primary font-medium text-sm sm:text-base font-manrope leading-5 flex items-center gap-0.5">
              -{effectivePointsUsed.toLocaleString()}
              <MPointBadge />
            </p>
          </div>
        </div>

        {/* Delivery */}
        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5 underline underline-offset-[3.8px]">
            Хүргэлт
          </p>
          <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-text-primary">
            {formatPrice(deliveryFee)}
          </p>
        </div>

        {/* Coupon */}
        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5">
            Миний купон
          </p>
          <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-text-primary">
            {couponCode ?? "—"}
          </p>
        </div>

        {/* Payment Wallet */}
        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5">
            Төлбөрийн хэрэгсэл
          </p>
          <p className="font-medium text-sm sm:text-base font-manrope leading-5 text-text-primary">
            {paymentWallet ?? "—"}
          </p>
        </div>

        {/* Points earned */}
        <div className="flex items-center justify-between">
          <p className="text-text-primary font-normal text-sm sm:text-base font-manrope leading-5">
            {BRAND.name} point
          </p>
          <p className="text-teal-600 font-medium text-sm sm:text-base font-manrope leading-5 flex items-center gap-0.5">
            +{pointsEarned.toLocaleString()}
            <MPointBadge />
          </p>
        </div>
      </div>
    </div>
  );
};
