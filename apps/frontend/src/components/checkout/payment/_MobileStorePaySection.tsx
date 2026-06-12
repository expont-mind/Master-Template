"use client";

// StorePay invoice-ready panel for the mobile payment modal.

import { formatPrice } from "@/components/checkout/constants";
import { Payment } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

import { BankField } from "./BankComponents";

import type { PaymentModalViewProps } from "./PaymentModalShared";

interface MobileStorePaySectionProps {
  phoneNumber: PaymentModalViewProps["phoneNumber"];
  orderNumber: PaymentModalViewProps["orderNumber"];
  totalAmount: number;
  copiedField: PaymentModalViewProps["copiedField"];
  handleCopy: PaymentModalViewProps["handleCopy"];
}

export function MobileStorePaySection({
  phoneNumber,
  orderNumber,
  totalAmount,
  copiedField,
  handleCopy,
}: MobileStorePaySectionProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {phoneNumber && <BankField label="Утасны дугаар" value={phoneNumber} />}
      <BankField
        label="Төлөх дүн"
        value={`${formatPrice(totalAmount)}₮`}
        copyable
        onCopy={() => handleCopy(String(totalAmount), "amount")}
        copied={copiedField === "amount"}
      />
      {orderNumber && (
        <BankField
          label="Захиалгын дугаар"
          value={orderNumber}
          copyable
          onCopy={() => handleCopy(orderNumber, "order")}
          copied={copiedField === "order"}
          semibold
        />
      )}

      <div className="py-2">
        <div className="h-px bg-border" />
      </div>

      <div className="bg-status-warning-bg rounded-[10px] px-4 py-4 flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5">
          <Payment />
        </div>
        <PrimaryMediumSm>StorePay апп дээр нэхэмжлэлийг баталгаажуулна уу.</PrimaryMediumSm>
      </div>
    </div>
  );
}
