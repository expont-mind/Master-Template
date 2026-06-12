"use client";

// Mobile drawer view for PaymentModal. State and side effects live in the
// parent PaymentModal; this component receives them via a single `view` prop
// object. Body content is in _PaymentModalMobileBody to keep this file under
// the lint thresholds.

import { Cancel, Reload } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

import { PaymentModalMobileBody } from "./_PaymentModalMobileBody";
import { LoadingSpinner, type PaymentModalViewProps } from "./PaymentModalShared";

function MobileFooterCheckButton({
  checking,
  onCheck,
}: {
  checking: boolean;
  onCheck: () => void;
}) {
  return (
    <div className="p-4 border-t border-border">
      <button
        onClick={onCheck}
        disabled={checking}
        className="w-full px-3 py-3 bg-text-primary rounded-lg cursor-pointer hover:bg-surface-dark transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? (
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-base font-manrope">Төлбөр шалгах</span>
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-white font-medium text-base font-manrope">Төлбөр шалгах</span>
            <Reload />
          </div>
        )}
      </button>
    </div>
  );
}

function shouldShowFooter(view: PaymentModalViewProps) {
  return (
    !view.isCreating && !view.createError && view.hasInvoice && view.paymentMethod !== "transfer"
  );
}

export function PaymentModalMobile({ view }: { view: PaymentModalViewProps }) {
  if (view.showSuccess) return null;

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col md:hidden"
      style={{ opacity: view.animate ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200 touch-none"
        onClick={view.onClose}
        aria-hidden="true"
      />

      <div
        className="relative mt-auto bg-white rounded-t-[10px] flex flex-col h-[90vh] transition-transform duration-200"
        style={{
          transform: view.animate ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <PrimaryHeading>Төлбөр төлөх</PrimaryHeading>
          <button onClick={view.onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          <PaymentModalMobileBody view={view} />
        </div>

        {shouldShowFooter(view) && (
          <MobileFooterCheckButton checking={view.checking} onCheck={view.handleManualCheck} />
        )}
      </div>
    </div>
  );
}
