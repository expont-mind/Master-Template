"use client";

import { MutedText, PrimaryMediumBase } from "@/components/ui/typography";
import { formatPrice } from "@/lib/utils/formatters";

import { CouponRow, PointRow } from "./_PointAndCouponRows";

interface CartPaymentSummaryDesktopProps {
  totalCount: number;
  subtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  couponDiscount: number;
  pointDiscount: number;
  totalPayable: number;
  pointBalance: number | null;
  onCheckout: () => void;
  onOpenCouponModal: () => void;
  onOpenPointModal: () => void;
}

export function CartPaymentSummaryDesktop({
  totalCount,
  subtotal,
  totalDiscount,
  deliveryFee,
  couponDiscount,
  pointDiscount,
  totalPayable,
  pointBalance,
  onCheckout,
  onOpenCouponModal,
  onOpenPointModal,
}: CartPaymentSummaryDesktopProps) {
  return (
    <div className="w-[342px] shrink-0 flex flex-col gap-6">
      <div className="flex flex-col gap-8">
        <p className="text-text-primary font-medium text-xl font-manrope">Төлбөрийн мэдээлэл</p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <MutedText>Үнийн дүн ({totalCount}ш)</MutedText>
              <PrimaryMediumBase>{formatPrice(subtotal)}</PrimaryMediumBase>
            </div>

            {totalDiscount > 0 && (
              <div className="flex items-center justify-between">
                <MutedText>Хэмнэсэн</MutedText>
                <p className="text-brand-primary font-medium text-base font-manrope">
                  -{formatPrice(totalDiscount)}
                </p>
              </div>
            )}

            <PointRow
              pointBalance={pointBalance}
              pointDiscount={pointDiscount}
              onOpenPointModal={onOpenPointModal}
            />

            <CouponRow couponDiscount={couponDiscount} onOpenCouponModal={onOpenCouponModal} />

            <div className="flex items-center justify-between">
              <MutedText>Хүргэлт</MutedText>
              <p
                className={`font-medium text-base font-manrope ${deliveryFee === 0 ? "text-teal-600" : "text-text-primary"}`}
              >
                {deliveryFee === 0 ? "Үнэгүй" : formatPrice(deliveryFee)}
              </p>
            </div>
          </div>
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-border" />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-text-primary font-semibold text-lg font-manrope">Нийт төлөх дүн</p>
          <p className="text-text-primary font-semibold text-lg font-manrope">
            {formatPrice(totalPayable)}
          </p>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="w-full py-2.5 px-3 bg-text-primary rounded-sm text-white font-normal text-base font-manrope cursor-pointer hover:bg-surface-dark transition-colors duration-200 text-center"
      >
        Үргэлжлүүлэх
      </button>
    </div>
  );
}
