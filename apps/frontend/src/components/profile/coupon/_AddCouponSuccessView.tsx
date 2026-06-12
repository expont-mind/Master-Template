"use client";

import { Coupon } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

import type { SuccessInfo } from "./_useAddCoupon";

export function AddCouponSuccessView({
  successInfo,
  onClose,
}: {
  successInfo: SuccessInfo;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-2">
      <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
        <div className="text-teal-500">
          <Coupon />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PrimaryHeading>Амжилттай нэмэгдлээ</PrimaryHeading>
        <p className="text-text-secondary font-normal text-base font-manrope text-center">
          {successInfo.code} кодтой {successInfo.label}
          <br />
          амжилттай нэмэгдлээ
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full max-w-[120px] py-2.5 px-3 rounded-sm font-normal text-base font-manrope bg-text-primary text-white cursor-pointer hover:bg-surface-dark transition-colors duration-200"
      >
        Ок
      </button>
    </div>
  );
}
