"use client";

import Link from "next/link";

import { Success } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

interface PaymentSuccessViewProps {
  animate: boolean;
  /** Transfer flow ends with a "submitted, awaiting confirmation" state
   *  rather than the immediate paid state every other provider hits.
   *  This flag swaps the icon color and copy. */
  transferSubmitted: boolean;
}

/**
 * Mobile-only success modal shown after payment is confirmed (or after
 * the user submits a transfer for manual reconciliation). Desktop has
 * its own success path inside the desktop content.
 */
export function PaymentSuccessView({ animate, transferSubmitted }: PaymentSuccessViewProps) {
  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center md:hidden"
      style={{ opacity: animate ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200 touch-none"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[375px] mx-4 bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
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
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
            >
              Захиалгаа харах
            </Link>
            <Link
              href="/products"
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
            >
              Дэлгүүр хэсэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
