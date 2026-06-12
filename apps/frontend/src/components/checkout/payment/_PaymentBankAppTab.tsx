"use client";

import Image from "next/image";

import { MutedTextXs, PrimarySm } from "@/components/ui/typography";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";

interface PaymentBankAppTabProps {
  totalAmount: number;
  onLendMNSelect?: () => void;
  onStorePaySelect?: () => void;
}

export function PaymentBankAppTab({
  totalAmount,
  onLendMNSelect,
  onStorePaySelect,
}: PaymentBankAppTabProps) {
  const storePayEnabled = totalAmount >= STOREPAY_MIN_AMOUNT;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-primary font-bold text-sm font-manrope">Хуваах төлөх</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onLendMNSelect}
            className="flex items-center gap-2.5 p-2 bg-white border border-border rounded-2xl hover:border-border-strong transition-colors cursor-pointer text-left"
          >
            <Image
              src="/lend-logo.png"
              alt="LendMN"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg border border-border object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <PrimarySm>LendMN</PrimarySm>
              <MutedTextXs>Хуваах төлөх</MutedTextXs>
            </div>
          </button>

          <button
            onClick={storePayEnabled ? onStorePaySelect : undefined}
            disabled={!storePayEnabled}
            className={`flex items-center gap-2.5 p-2 bg-white border border-border rounded-2xl transition-colors text-left ${storePayEnabled ? "hover:border-border-strong cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          >
            <Image
              src="/storepay.png"
              alt="StorePay"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg border border-border object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <PrimarySm>StorePay</PrimarySm>
              <p
                className={`font-normal text-xs font-manrope ${!storePayEnabled ? "text-red-500" : "text-text-secondary"}`}
              >
                {!storePayEnabled
                  ? `${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш`
                  : "Хуваарь төлөлт"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentTabHeader({
  activeTab,
  setActiveTab,
}: {
  activeTab: "qr" | "bank";
  setActiveTab: (tab: "qr" | "bank") => void;
}) {
  return (
    <div className="flex border-b border-border">
      <button
        onClick={() => setActiveTab("qr")}
        className={`flex-1 py-3 border-b-2 text-base font-medium font-manrope cursor-pointer transition-colors duration-200 ${
          activeTab === "qr"
            ? "text-text-primary border-text-primary"
            : "text-text-secondary border-transparent"
        }`}
      >
        QR / Дансаар шилжүүлэх
      </button>
      <button
        onClick={() => setActiveTab("bank")}
        className={`flex-1 py-3 border-b-2 text-base font-medium font-manrope cursor-pointer transition-colors duration-200 ${
          activeTab === "bank"
            ? "text-text-primary border-text-primary"
            : "text-text-secondary border-transparent"
        }`}
      >
        Банк / ББС -ын апп
      </button>
    </div>
  );
}
