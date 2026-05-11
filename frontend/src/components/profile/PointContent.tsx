"use client";

import { BRAND } from "@/lib/utils/brand-config";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  HelpCircle,
  MPointBadge,
  MPointLogo,
  PointText,
  Point,
  ChevronRightProduct,
  Slash,
  ChevronDownFAQ,
} from "@/components/svg";
import Link from "next/link";
import { parseAsUTC } from "@/lib/utils/formatters";
import { PointDetailModal } from "./PointDetailModal";

interface PointTransaction {
  id: string;
  type: "earned" | "used" | "promotional" | "refund";
  amount: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
  orders: { order_number: string | null } | null;
}

interface PointFaq {
  id: string;
  question: string;
  answer: string;
}

const tabs = ["Бүгд", "Ашигласан", "Нэмэгдсэн"] as const;

interface PointContentProps {
  onBalanceChange?: (balance: number) => void;
}

function formatPointDate(dateStr: string): string {
  return parseAsUTC(dateStr)
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(", ", " · ");
}

export const PointContent = ({ onBalanceChange }: PointContentProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showAbout = searchParams.get("view") === "about";
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<PointTransaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [pointFaqs, setPointFaqs] = useState<PointFaq[]>([]);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  const fetchPointData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: txns } = await supabase
      .from("point_transactions")
      .select(
        "id, type, amount, description, order_id, created_at, orders(order_number)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<PointTransaction[]>();

    const list = txns ?? [];
    setTransactions(list);

    const total = list.reduce(
      (sum: number, t: PointTransaction) => sum + t.amount,
      0,
    );
    setBalance(total);
    onBalanceChange?.(total);

    // Fetch point FAQs
    const { data: faqData } = await supabase
      .from("faqs")
      .select("id, question, answer")
      .eq("category", "point")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (faqData) setPointFaqs(faqData as PointFaq[]);

    setLoading(false);
  }, [onBalanceChange]);

  useEffect(() => {
    fetchPointData();
  }, [fetchPointData]);

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return t.type === "used";
    return (
      t.type === "earned" || t.type === "promotional" || t.type === "refund"
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col mt-[-20px] md:mt-0">
        {/* Header skeleton */}
        <div className="bg-slate-100 h-[220px] md:h-[200px]"></div>
        {/* Transaction history skeleton */}
        <div className="flex flex-col gap-3 px-4 md:px-0 pt-5 md:pt-10">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-28 skeleton rounded" />
            <div className="flex gap-2">
              <div className="flex-1 h-8 skeleton rounded-full" />
              <div className="flex-1 h-8 skeleton rounded-full" />
              <div className="flex-1 h-8 skeleton rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-14 skeleton rounded" />
            <div className="h-14 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (showAbout) {
    return (
      <div className="flex flex-col px-4 md:px-0 gap-2">
        {/* Breadcrumb */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 px-px md:px-0.5">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />

            <Link
              href="/profile?tab=point"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              {BRAND.name} point
            </Link>
            <Slash />
            <p className="text-slate-950 text-sm font-normal font-manrope">
              Тухай
            </p>
          </div>

          <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
            Тухай
          </p>
        </div>

        {/* FAQ Accordion */}
        {pointFaqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="p-[9px]">
                <HelpCircle />
              </div>
              <p className="text-[#64748B] font-normal text-base font-manrope">
                Одоогоор мэдээлэл алга байна
              </p>
            </div>
          </div>
        ) : (
          <>
            {pointFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className="border-b border-[#E2E8F0] flex flex-col"
              >
                <button
                  className="w-full py-3.5 flex items-center justify-between gap-3 md:gap-4 text-left cursor-pointer"
                  onClick={() =>
                    setFaqOpenIndex(faqOpenIndex === index ? null : index)
                  }
                  aria-expanded={faqOpenIndex === index}
                >
                  <span className="text-[#020617] font-medium text-sm md:text-lg font-manrope">
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 transition-transform duration-300 ease-in-out ${faqOpenIndex === index ? "rotate-180" : "rotate-0"}`}
                  >
                    <ChevronDownFAQ />
                  </div>
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: faqOpenIndex === index ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`text-[#64748B] pt-2 pb-3.5 font-normal text-sm md:text-lg font-manrope transition-opacity duration-300 ease-in-out ${
                        faqOpenIndex === index ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-[-20px] md:mt-0">
      {/* Header */}
      <div className="md:flex items-center gap-1.5 px-px md:px-0.5 pb-3 hidden">
        <Link
          href="/profile"
          className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
        >
          Профайл
        </Link>
        <Slash />

        <p className="text-slate-950 text-sm font-normal font-manrope">
          {BRAND.name} point
        </p>
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
            <p className="text-slate-950 text-sm font-normal font-manrope">
              {BRAND.name} point
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-bold text-2xl md:text-[26px] font-manrope">
              {BRAND.name} point
            </p>
            <button
              className="p-1 cursor-pointer"
              onClick={() => router.push("/profile?tab=point&view=about")}
            >
              <HelpCircle />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl px-5 pb-6 pt-5 flex items-start justify-between shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] font-normal text-sm font-manrope px-0.5">
              Дансны үлдэгдэл
            </p>
            <p className="text-[#020617] font-bold text-4xl font-manrope leading-7">
              {balance.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-1.5">
            <MPointLogo />
            <PointText />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="flex flex-col gap-3 md:gap-4 px-4 md:px-0 pt-5 md:pt-10">
        <div className="flex flex-col gap-3">
          <p className="text-[#020617] font-medium text-sm font-manrope">
            Гүйлгээний түүх
          </p>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex-1 h-8 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors ${
                  index === activeTab
                    ? "bg-[#020617] border-[#020617] text-white font-medium"
                    : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex flex-col gap-2">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-10">
              <div className="flex flex-col items-center justify-center">
                <div className="p-[9px]">
                  <Point />
                </div>
                <p className="text-[#64748B] font-normal text-base font-manrope">
                  Одоогоор гүйлгээ алга байна
                </p>
              </div>
              <Link
                href="/products"
                className="px-3 py-2.5 flex items-center gap-0.5 text-[#020617] font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px]"
              >
                <span className="px-0.5">Бараа сонирхох</span>
                <ChevronRightProduct />
              </Link>
            </div>
          ) : (
            filteredTransactions.map((txn) => {
              const isPositive = txn.amount > 0;
              return (
                <div
                  key={txn.id}
                  onClick={() => {
                    setSelectedTxn(txn);
                    setDetailModalOpen(true);
                  }}
                  className="flex items-center justify-between py-3 border-b border-[#E2E8F0] last:border-b-0 cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-150 -mx-1 px-1 rounded"
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[#020617] font-400 text-sm font-manrope">
                      {txn.description ??
                        (txn.type === "promotional" ? "Урамшуулал" : "Гүйлгээ")}
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Point Detail Modal */}
      <PointDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        data={
          selectedTxn
            ? (() => {
                const txnIndex = transactions.indexOf(selectedTxn);
                const balanceAfter = transactions
                  .slice(txnIndex)
                  .reduce((sum, t) => sum + t.amount, 0);
                const balanceBefore = balanceAfter - selectedTxn.amount;
                const used = selectedTxn.amount < 0 ? selectedTxn.amount : 0;
                const earned = selectedTxn.amount > 0 ? selectedTxn.amount : 0;
                const orderId = selectedTxn.order_id;
                const orderNumber = selectedTxn.orders?.order_number ?? null;
                const description =
                  selectedTxn.description ??
                  (selectedTxn.type === "promotional"
                    ? "Урамшуулал"
                    : "Гүйлгээ");

                return {
                  orderId,
                  orderNumber,
                  balanceBefore,
                  used,
                  earned,
                  balanceAfter,
                  description,
                };
              })()
            : null
        }
      />
    </div>
  );
};
