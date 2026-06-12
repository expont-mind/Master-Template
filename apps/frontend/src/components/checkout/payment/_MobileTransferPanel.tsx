"use client";

// Bank-transfer details panel for the mobile payment modal.

import { formatPrice } from "@/components/checkout/constants";
import { Payment } from "@/components/svg";

import { BankField } from "./BankComponents";

import type { PaymentModalViewProps } from "./PaymentModalShared";

interface MobileTransferPanelProps {
  orderNumber: PaymentModalViewProps["orderNumber"];
  totalAmount: number;
  copiedField: PaymentModalViewProps["copiedField"];
  handleCopy: PaymentModalViewProps["handleCopy"];
  setTransferSubmitted: PaymentModalViewProps["setTransferSubmitted"];
  onPaymentSuccess: PaymentModalViewProps["onPaymentSuccess"];
  onQPayReselect: PaymentModalViewProps["onQPayReselect"];
}

export function MobileTransferPanel({
  orderNumber,
  totalAmount,
  copiedField,
  handleCopy,
  setTransferSubmitted,
  onPaymentSuccess,
  onQPayReselect,
}: MobileTransferPanelProps) {
  const bankName = process.env.NEXT_PUBLIC_QUICKPAY_BANK_NAME || "";
  const accountName = process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || "";
  const accountNumber = process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER || "";

  return (
    <>
      <BankField label="Банк" value={bankName} />
      <BankField
        label="Данс эзэмшигч"
        value={accountName}
        copyable
        onCopy={() => handleCopy(accountName, "owner")}
        copied={copiedField === "owner"}
      />
      <BankField
        label="Дансы дугаар"
        value={accountNumber}
        copyable
        onCopy={() => handleCopy(accountNumber, "bankNumber")}
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

      <div className="bg-status-warning-bg rounded-[10px] px-3 py-3 flex items-start gap-2.5 mt-1">
        <div className="shrink-0 mt-0.5">
          <Payment />
        </div>
        <p className="text-text-primary font-medium text-xs font-manrope leading-5">
          Гүйлгээний утга дээрх захиалгын дугаарыг заавал бичнэ үү! Төлбөр төлснөөс хойш 2-4 цагийн
          дотор захиалга баталгаажна.
          <br />
          Тусламж: 7771-0990, 88900900
        </p>
      </div>

      <button
        onClick={() => {
          setTransferSubmitted(true);
          onPaymentSuccess();
        }}
        className="w-full px-3 py-2.5 mt-1 bg-text-primary rounded-lg cursor-pointer hover:bg-surface-dark transition-colors duration-200 text-white font-medium text-sm font-manrope"
      >
        Төлсөн бол дар
      </button>

      <button
        onClick={onQPayReselect}
        className="w-full px-3 py-2.5 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors duration-200 text-text-primary font-medium text-sm font-manrope"
      >
        QR код уншуулах
      </button>
    </>
  );
}
