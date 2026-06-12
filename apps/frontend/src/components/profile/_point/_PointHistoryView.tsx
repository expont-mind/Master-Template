"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronRightProduct,
  HelpCircle,
  MPointBadge,
  MPointLogo,
  Point,
  PointText,
  Slash,
} from "@/components/svg";
import { MutedText, PrimaryMediumSm } from "@/components/ui/typography";
import { BRAND } from "@/lib/utils/brand-config";

import { formatPointDate, POINT_TABS, type PointTransaction } from "./_types";

interface PointHistoryViewProps {
  balance: number;
  activeTab: number;
  onChangeTab: (idx: number) => void;
  filteredTransactions: PointTransaction[];
  onSelectTxn: (txn: PointTransaction) => void;
}

function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="bg-white rounded-xl px-5 pb-6 pt-5 flex items-start justify-between shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary font-normal text-sm font-manrope px-0.5">
          Дансны үлдэгдэл
        </p>
        <p className="text-text-primary font-bold text-4xl font-manrope leading-7">
          {balance.toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-1.5 pt-1.5">
        <MPointLogo />
        <PointText />
      </div>
    </div>
  );
}

function HistoryTabs({
  activeTab,
  onChangeTab,
}: {
  activeTab: number;
  onChangeTab: (idx: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {POINT_TABS.map((tab, index) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChangeTab(index)}
          className={`flex-1 h-8 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors ${
            index === activeTab
              ? "bg-text-primary border-text-primary text-white font-medium"
              : "bg-white border-border text-text-secondary hover:bg-surface"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function TransactionRow({
  txn,
  onSelect,
}: {
  txn: PointTransaction;
  onSelect: (txn: PointTransaction) => void;
}) {
  const isPositive = txn.amount > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(txn)}
      className="w-full text-left flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-surface transition-colors duration-150 -mx-1 px-1 rounded bg-transparent"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-text-primary font-400 text-sm font-manrope">
          {txn.description ?? (txn.type === "promotional" ? "Урамшуулал" : "Гүйлгээ")}
        </p>
        <p className="text-slate-500 font-normal text-xs font-manrope">
          {formatPointDate(txn.created_at)}
        </p>
      </div>
      <div
        className={`flex items-center font-semibold text-base font-manrope whitespace-nowrap ${
          isPositive ? "text-teal-500" : "text-rose-500"
        }`}
      >
        {isPositive ? "+" : ""}
        {txn.amount.toLocaleString()}
        <MPointBadge className="ml-[2px]" />
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-10">
      <div className="flex flex-col items-center justify-center">
        <div className="p-[9px]">
          <Point />
        </div>
        <MutedText>Одоогоор гүйлгээ алга байна</MutedText>
      </div>
      <Link
        href="/products"
        className="px-3 py-2.5 flex items-center gap-0.5 text-text-primary font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px]"
      >
        <span className="px-0.5">Бараа сонирхох</span>
        <ChevronRightProduct />
      </Link>
    </div>
  );
}

export function PointHistoryView({
  balance,
  activeTab,
  onChangeTab,
  filteredTransactions,
  onSelectTxn,
}: PointHistoryViewProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col mt-[-20px] md:mt-0">
      <div className="md:flex items-center gap-1.5 px-px md:px-0.5 pb-3 hidden">
        <Link
          href="/profile"
          className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
        >
          Профайл
        </Link>
        <Slash />
        <p className="text-slate-950 text-sm font-normal font-manrope">{BRAND.name} point</p>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-5 pb-8 bg-slate-100">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 px-px md:px-0.5 md:hidden">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />
            <p className="text-slate-950 text-sm font-normal font-manrope">{BRAND.name} point</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-text-primary font-bold text-2xl md:text-[26px] font-manrope">
              {BRAND.name} point
            </p>
            <button
              type="button"
              className="p-1 cursor-pointer"
              onClick={() => router.push("/profile?tab=point&view=about")}
            >
              <HelpCircle />
            </button>
          </div>
        </div>
        <BalanceCard balance={balance} />
      </div>

      <div className="flex flex-col gap-3 md:gap-4 px-4 md:px-0 pt-5 md:pt-10">
        <div className="flex flex-col gap-3">
          <PrimaryMediumSm>Гүйлгээний түүх</PrimaryMediumSm>
          <HistoryTabs activeTab={activeTab} onChangeTab={onChangeTab} />
        </div>
        <div className="flex flex-col gap-2">
          {filteredTransactions.length === 0 ? (
            <EmptyState />
          ) : (
            filteredTransactions.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} onSelect={onSelectTxn} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
