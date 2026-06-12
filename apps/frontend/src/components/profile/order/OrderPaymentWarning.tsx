"use client";

import { Trash2 as Trash2Small } from "lucide-react";

import { PaymentRed } from "@/components/svg";

interface OrderPaymentWarningProps {
  onPaymentClick: () => void;
  onRequestDelete?: () => void;
}

export const OrderPaymentWarning = ({
  onPaymentClick,
  onRequestDelete,
}: OrderPaymentWarningProps) => {
  return (
    <div className="border border-border rounded-[10px] sm:rounded-sm overflow-hidden">
      <div className="flex flex-col px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-4">
        {/* Mobile: title + body + icon/button row */}
        <div className="flex flex-col sm:hidden">
          <p className="text-status-error-text font-medium text-sm font-manrope leading-5">
            Төлбөр хийгдээгүй
          </p>
          <p className="text-status-error-text font-normal text-sm font-manrope leading-5 mt-0.5">
            Та дансны гүйлгээгээ ахин шалгаж, төлбөрөө гүйцээж, захиалгаа баталгаажуулна уу.
          </p>
          <div className="flex items-center justify-between mt-6">
            <PaymentRed />
            <button
              onClick={onPaymentClick}
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
            <p className="text-red-600 font-medium text-sm font-manrope leading-5">
              Төлбөр хийгдээгүй
            </p>
            <p className="text-red-600 font-normal text-sm font-manrope leading-5">
              Та дансны гүйлгээгээ ахин шалгаж, төлбөрөө гүйцээж, захиалгаа баталгаажуулна уу.
            </p>
          </div>
        </div>
        <button
          onClick={onPaymentClick}
          className="hidden sm:block shrink-0 px-3 py-1 bg-slate-950 rounded-sm text-white font-normal text-base font-manrope transition-colors cursor-pointer"
        >
          <span className="px-0.5">Төлбөр төлөх</span>
        </button>
      </div>
      {onRequestDelete && (
        <>
          <div className="h-px bg-border" />
          <button
            onClick={onRequestDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-status-error-text font-medium text-sm font-manrope hover:bg-status-error-bg transition-colors cursor-pointer"
          >
            <Trash2Small className="w-4 h-4" />
            Захиалга устгах
          </button>
        </>
      )}
    </div>
  );
};
