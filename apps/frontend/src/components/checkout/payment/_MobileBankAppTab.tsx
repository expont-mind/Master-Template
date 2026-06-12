"use client";

// Bank-app tab for the mobile payment modal. Lists primary banks and
// installment partners (StorePay, LendMN, etc.).

import { MutedTextXs, PrimarySm } from "@/components/ui/typography";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";

import { BankAppCard, getBankDescription } from "./BankComponents";

import type { PaymentModalViewProps } from "./PaymentModalShared";

const INSTALLMENT_BANK_KEYWORDS = ["storepay", "pocket", "ard", "simple", "leasing", "lend"];
const INSTALLMENT_FILTER_KEYWORDS = ["storepay", "pocket", "ard", "simple", "leasing"];

interface MobileBankAppTabProps {
  invoiceData: NonNullable<PaymentModalViewProps["invoiceData"]>;
  onLendMNSelect: PaymentModalViewProps["onLendMNSelect"];
  onStorePaySelect: PaymentModalViewProps["onStorePaySelect"];
  totalAmount: number;
}

export function MobileBankAppTab({
  invoiceData,
  onLendMNSelect,
  onStorePaySelect,
  totalAmount,
}: MobileBankAppTabProps) {
  const primaryBanks =
    invoiceData.urls?.filter(
      (bank) => !INSTALLMENT_BANK_KEYWORDS.some((name) => bank.name.toLowerCase().includes(name)),
    ) ?? [];
  const installmentBanks =
    invoiceData.urls?.filter((bank) =>
      INSTALLMENT_FILTER_KEYWORDS.some((name) => bank.name.toLowerCase().includes(name)),
    ) ?? [];
  const storepayDisabled = totalAmount < STOREPAY_MIN_AMOUNT;

  return (
    <div className="flex flex-col gap-5 p-4">
      {primaryBanks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-text-primary font-bold text-sm font-manrope">Банк, хэтэвч</p>
          <div className="grid grid-cols-2 gap-3">
            {primaryBanks.map((bank) => (
              <BankAppCard
                key={bank.name}
                bank={bank}
                description={getBankDescription(bank.name)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-text-primary font-bold text-sm font-manrope">Хуваах төлөх</p>
        <div className="grid grid-cols-2 gap-3">
          {installmentBanks.map((bank) => (
            <BankAppCard key={bank.name} bank={bank} description={getBankDescription(bank.name)} />
          ))}

          <button
            onClick={onLendMNSelect}
            className="flex items-center gap-2.5 p-2 bg-white border border-border rounded-2xl hover:border-border-strong transition-colors cursor-pointer text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
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
            onClick={storepayDisabled ? undefined : onStorePaySelect}
            disabled={storepayDisabled}
            className={`flex items-center gap-2.5 p-2 bg-white border border-border rounded-2xl transition-colors text-left ${
              storepayDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-border-strong cursor-pointer"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/storepay.png"
              alt="StorePay"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg border border-border object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <PrimarySm>StorePay</PrimarySm>
              <p
                className={`font-normal text-xs font-manrope ${
                  storepayDisabled ? "text-red-500" : "text-text-secondary"
                }`}
              >
                {storepayDisabled
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
