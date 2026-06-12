"use client";

import { formatPrice } from "@/components/checkout/constants";
import { Payment } from "@/components/svg";
import { PrimaryMediumSm, PrimarySm } from "@/components/ui/typography";

import { CheckPaymentButton } from "./_PaymentModalCommon";
import { BankField } from "./BankComponents";

import type { QPayInvoiceData } from "@/lib/qpay/types";

interface QrViewProps {
  invoiceData: QPayInvoiceData;
  handleManualCheck: () => void;
  checking: boolean;
  onTransferSelect: () => void;
}

export function PaymentQpayQrView({
  invoiceData,
  handleManualCheck,
  checking,
  onTransferSelect,
}: QrViewProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <PrimarySm>QR код уншуулах</PrimarySm>
      <div className="w-[230px] h-[230px] bg-border-light flex items-center justify-center overflow-hidden">
        {invoiceData.qr_image ? (
          // data: URL from QPay; next/image doesn't handle base64 data URLs well.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${invoiceData.qr_image}`}
            alt="QPay QR Code"
            width={230}
            height={230}
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-text-muted text-xs font-manrope">QR код байхгүй</p>
        )}
      </div>

      <CheckPaymentButton onClick={handleManualCheck} checking={checking} />

      <button
        onClick={onTransferSelect}
        className="w-full px-3 py-2.5 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200 text-text-primary font-medium text-sm font-manrope"
      >
        Дансаар шилжүүлэх
      </button>
    </div>
  );
}

interface TransferViewProps {
  totalAmount: number;
  orderNumber: string | null;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => void;
  onQPayReselect: () => void;
  onTransferSubmit: () => void;
}

export function PaymentTransferView({
  totalAmount,
  orderNumber,
  copiedField,
  handleCopy,
  onQPayReselect,
  onTransferSubmit,
}: TransferViewProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <BankField label="Банк" value={process.env.NEXT_PUBLIC_QUICKPAY_BANK_NAME || ""} />
      <BankField
        label="Данс эзэмшигч"
        value={process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || ""}
        copyable
        onCopy={() => handleCopy(process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || "", "owner")}
        copied={copiedField === "owner"}
      />
      <BankField
        label="Дансы дугаар"
        value={process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER || ""}
        copyable
        onCopy={() =>
          handleCopy(process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER || "", "bankNumber")
        }
        copied={copiedField === "bankNumber"}
      />
      <BankField
        label="Төлөх дүн"
        value={`${formatPrice(totalAmount)}₮`}
        copyable
        onCopy={() => handleCopy(String(totalAmount), "amount")}
        copied={copiedField === "amount"}
      />
      {orderNumber && (
        <BankField
          label="Гүйлгээний утга"
          value={orderNumber}
          copyable
          onCopy={() => handleCopy(orderNumber, "order")}
          copied={copiedField === "order"}
          semibold
        />
      )}

      <div className="bg-status-warning-bg rounded-[10px] px-4 py-4 flex items-start gap-2.5 mt-1">
        <div className="shrink-0 mt-0.5">
          <Payment />
        </div>
        <PrimaryMediumSm>
          Гүйлгээний утга дээрх захиалгын дугаарыг заавал бичнэ үү! Төлбөр төлснөөс хойш 2-4 цагийн
          дотор захиалга баталгаажна. Тусламж: 7771-0990, 88900900
        </PrimaryMediumSm>
      </div>

      <button
        onClick={onTransferSubmit}
        className="w-full px-3 py-2.5 mt-1 bg-text-primary rounded-sm cursor-pointer hover:bg-surface-dark transition-colors duration-200 text-white font-medium text-sm font-manrope"
      >
        Төлсөн бол дар
      </button>

      <button
        onClick={onQPayReselect}
        className="w-full px-3 py-2.5 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200 text-text-primary font-medium text-sm font-manrope"
      >
        QR код уншуулах
      </button>
    </div>
  );
}
