"use client";

// Desktop centered-modal view for PaymentModal. Mirrors PaymentModalMobile but
// uses a fixed centered card with scaled-in animation instead of a bottom
// drawer. Receives all state and callbacks via a single `view` prop object.

import { Cancel } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

import { PaymentCheckErrorBanner } from "./_PaymentModalCommon";
import { PaymentModalDesktopBody } from "./_PaymentModalDesktopBody";
import { type PaymentModalViewProps } from "./PaymentModalShared";

export function PaymentModalDesktop({ view }: { view: PaymentModalViewProps }) {
  const { animate, onClose, showSuccess, checkFailed, checkError } = view;

  return (
    <div className="fixed inset-0 z-999 hidden md:flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={showSuccess ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${showSuccess ? "max-w-[375px]" : "max-w-[600px]"} max-h-[90vh] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 overflow-y-auto`}
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {!showSuccess && (
          <div className="flex items-center justify-between">
            <PrimaryHeading>Төлбөр төлөх</PrimaryHeading>
            <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
              <Cancel />
            </button>
          </div>
        )}

        {checkFailed && !showSuccess && <PaymentCheckErrorBanner checkError={checkError} />}

        <div className="flex flex-col gap-5">
          <PaymentModalDesktopBody view={view} />
        </div>
      </div>
    </div>
  );
}
