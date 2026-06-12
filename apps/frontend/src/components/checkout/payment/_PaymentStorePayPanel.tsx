"use client";

import { formatPrice } from "@/components/checkout/constants";
import { Payment } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

import { CheckPaymentButton } from "./_PaymentModalCommon";
import { BankField } from "./BankComponents";

interface PaymentStorePayPanelProps {
  totalAmount: number;
  orderNumber: string | null;
  phoneNumber?: string;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => void;
  handleManualCheck: () => void;
  checking: boolean;
}

export function PaymentStorePayPanel({
  totalAmount,
  orderNumber,
  phoneNumber,
  copiedField,
  handleCopy,
  handleManualCheck,
  checking,
}: PaymentStorePayPanelProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
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

      <CheckPaymentButton onClick={handleManualCheck} checking={checking} />
    </div>
  );
}
