"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { PointAboutView } from "./_point/_PointAboutView";
import { PointHistoryView } from "./_point/_PointHistoryView";
import { PointLoadingSkeleton } from "./_point/_PointLoadingSkeleton";
import { filterTransactionsByTab, type PointTransaction } from "./_point/_types";
import { deriveTransactionDetail, usePointData } from "./_point/_usePointData";
import { PointDetailModal } from "./PointDetailModal";

interface PointContentProps {
  onBalanceChange?: (balance: number) => void;
}

export const PointContent = ({ onBalanceChange }: PointContentProps) => {
  const searchParams = useSearchParams();
  const showAbout = searchParams.get("view") === "about";

  const { transactions, balance, loading, pointFaqs } = usePointData(onBalanceChange);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState<PointTransaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  if (loading) return <PointLoadingSkeleton />;
  if (showAbout) return <PointAboutView faqs={pointFaqs} />;

  const filteredTransactions = filterTransactionsByTab(transactions, activeTab);
  const detailData = deriveTransactionDetail(transactions, selectedTxn);

  return (
    <>
      <PointHistoryView
        balance={balance}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        filteredTransactions={filteredTransactions}
        onSelectTxn={(txn) => {
          setSelectedTxn(txn);
          setDetailModalOpen(true);
        }}
      />

      <PointDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        data={detailData}
      />
    </>
  );
};
