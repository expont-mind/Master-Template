"use client";

// QR code panel for the mobile payment modal's QR/transfer tab.

import { PrimarySm } from "@/components/ui/typography";

import type { PaymentModalViewProps } from "./PaymentModalShared";

interface MobileQPayQRPanelProps {
  invoiceData: NonNullable<PaymentModalViewProps["invoiceData"]>;
  onTransferSelect: (() => void) | undefined;
}

export function MobileQPayQRPanel({ invoiceData, onTransferSelect }: MobileQPayQRPanelProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <PrimarySm>QR код уншуулах</PrimarySm>
        <div className="w-[200px] h-[200px] bg-border-light flex items-center justify-center overflow-hidden rounded-lg">
          {invoiceData.qr_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${invoiceData.qr_image}`}
              alt="QPay QR Code"
              width={200}
              height={200}
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-text-muted text-xs font-manrope">QR код байхгүй</p>
          )}
        </div>
      </div>

      {onTransferSelect && (
        <button
          onClick={onTransferSelect}
          className="w-full px-3 py-2.5 mt-1 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors duration-200 text-text-primary font-medium text-sm font-manrope"
        >
          Дансаар шилжүүлэх
        </button>
      )}
    </>
  );
}
