"use client";

// Shared UI fragments used by both PaymentModalDesktop and (potentially)
// PaymentModalMobile. Extracted from PaymentModalDesktop to keep the
// view function under the max-lines-per-function limit.

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { Reload, Success } from "@/components/svg";
import { Spinner } from "@/components/ui/Spinner";
import { MutedMediumSm, PrimaryHeading } from "@/components/ui/typography";

import { LoadingSpinner } from "./PaymentModalShared";

export function PaymentCheckErrorBanner({ checkError }: { checkError: string | null }) {
  return (
    <div className="border border-border bg-status-error-bg rounded-[10px] flex items-start px-4 py-3 gap-3">
      <AlertCircle color="#DC2626" size={16} />
      <div className="flex flex-col gap-0.5">
        <p className="text-red-600 font-medium text-sm font-manrope">
          {checkError ? "Төлбөр шалгахад алдаа гарлаа" : "Төлбөр төлөгдсөн мэдээлэл ирсэнгүй"}
        </p>
        <p className="text-red-600 font-normal text-sm font-manrope">
          {checkError
            ? checkError
            : "Банкнаас төлбөр төлөгдсөн мэдээлэл ирсэнгүй. Та түр хүлээгээд дахин оролдоно уу!"}
        </p>
      </div>
    </div>
  );
}

export function InvoiceCreatingPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-border-light flex items-center justify-center">
        <Spinner size="sm" />
      </div>
      <MutedMediumSm>Нэхэмжлэл үүсгэж байна...</MutedMediumSm>
    </div>
  );
}

export function InvoiceErrorPanel({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-red-500 font-medium text-sm font-manrope text-center">{message}</p>
      <button
        onClick={onClose}
        className="text-text-secondary font-medium text-sm font-manrope underline cursor-pointer"
      >
        Хаах
      </button>
    </div>
  );
}

export function PaymentSuccessPanel({ transferSubmitted }: { transferSubmitted: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div
        className={`w-[56px] h-[56px] ${
          transferSubmitted ? "bg-amber-500" : "bg-teal-500"
        } rounded-full flex items-center justify-center`}
      >
        <Success />
      </div>
      <div className="flex flex-col items-center gap-2">
        <PrimaryHeading>
          {transferSubmitted ? "Захиалга бүртгэгдлээ" : "Захиалга баталгаажлаа"}
        </PrimaryHeading>
        <p className="text-text-secondary font-normal text-base font-manrope text-center">
          {transferSubmitted
            ? "Төлбөр төлснөөс хойш 2-4 цагийн дотор захиалга баталгаажна"
            : "Та захиалгаа профайл цэснээс хянах боломжтой"}
        </p>
      </div>
      <div className="flex gap-[10px] w-full">
        <Link
          href="/profile"
          prefetch
          className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
        >
          Захиалгаа харах
        </Link>
        <Link
          href="/products"
          prefetch
          className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
        >
          Дэлгүүр хэсэх
        </Link>
      </div>
    </div>
  );
}

// Shared "Check payment" CTA button used in 4 places in the desktop view.
export function CheckPaymentButton({
  onClick,
  checking,
}: {
  onClick: () => void;
  checking: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={checking}
      className="w-full px-3 py-2.5 bg-text-primary rounded-sm cursor-pointer hover:bg-surface-dark transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {checking ? (
        <div className="flex items-center gap-1">
          <span className="text-white font-normal text-base font-manrope">Шалгаж байна...</span>
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <span className="px-0.5 text-white font-normal text-base font-manrope">
            Төлбөр шалгах
          </span>
          <Reload />
        </div>
      )}
    </button>
  );
}
