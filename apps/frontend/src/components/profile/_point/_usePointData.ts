"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { type PointFaq, type PointTransaction } from "./_types";

export function usePointData(onBalanceChange?: (balance: number) => void) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pointFaqs, setPointFaqs] = useState<PointFaq[]>([]);

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
      .select("id, type, amount, description, order_id, created_at, orders(order_number)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<PointTransaction[]>();

    const list = txns ?? [];
    setTransactions(list);

    const total = list.reduce((sum, t) => sum + t.amount, 0);
    setBalance(total);
    onBalanceChange?.(total);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot Supabase fetch on mount that hydrates points + FAQs
    fetchPointData();
  }, [fetchPointData]);

  return { transactions, balance, loading, pointFaqs };
}

export function deriveTransactionDetail(
  transactions: PointTransaction[],
  selectedTxn: PointTransaction | null,
) {
  if (!selectedTxn) return null;
  const txnIndex = transactions.indexOf(selectedTxn);
  const balanceAfter = transactions.slice(txnIndex).reduce((sum, t) => sum + t.amount, 0);
  const balanceBefore = balanceAfter - selectedTxn.amount;
  const used = selectedTxn.amount < 0 ? selectedTxn.amount : 0;
  const earned = selectedTxn.amount > 0 ? selectedTxn.amount : 0;
  const description =
    selectedTxn.description ?? (selectedTxn.type === "promotional" ? "Урамшуулал" : "Гүйлгээ");
  return {
    orderId: selectedTxn.order_id,
    orderNumber: selectedTxn.orders?.order_number ?? null,
    balanceBefore,
    used,
    earned,
    balanceAfter,
    description,
  };
}
