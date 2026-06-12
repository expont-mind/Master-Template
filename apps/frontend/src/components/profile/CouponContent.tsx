"use client";

import Link from "next/link";
import { useState } from "react";

import { Coupon, Plus, Slash } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";

import { AddCouponModal } from "./AddCouponModal";
import { useCouponList } from "./coupon/_useCouponList";
import { CouponCard } from "./CouponCard";

const tabs = ["Идэвхтэй", "Ашигласан", "Эрх дууссан"] as const;

type CouponStatus = "active" | "used" | "expired";

const tabStatusMap: Record<number, CouponStatus> = {
  0: "active",
  1: "used",
  2: "expired",
};

interface CouponContentProps {
  onCouponCountChange?: (count: number) => void;
}

export const CouponContent = ({ onCouponCountChange }: CouponContentProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const { coupons, loading, refetch } = useCouponList(onCouponCountChange);

  const filteredCoupons = coupons.filter((coupon) => coupon.status === tabStatusMap[activeTab]);

  const getTabCount = (tabIndex: number) =>
    coupons.filter((coupon) => coupon.status === tabStatusMap[tabIndex]).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 pb-3">
          <div className="h-7 w-40 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 skeleton rounded-full" />
            <div className="h-8 w-24 skeleton rounded-full" />
            <div className="h-8 w-28 skeleton rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />

          <p className="text-slate-950 text-sm font-normal font-manrope">Миний купон</p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Миний купон
        </p>
      </div>

      <div className="flex gap-2 items-start -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(index)}
            className={`h-8 px-4 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors shrink-0 ${
              index === activeTab
                ? "bg-text-primary border-text-primary text-white font-medium"
                : "bg-white border-border text-text-secondary hover:bg-surface"
            }`}
          >
            {tab} ({getTabCount(index)})
          </button>
        ))}
      </div>

      {/* Coupons */}
      <div className="flex flex-col gap-3">
        {filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="p-[9px]">
                <Coupon />
              </div>
              <MutedText>Одоогоор купон алга байна</MutedText>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-text-primary font-normal text-base font-manrope cursor-pointer"
            >
              <Plus />
              <span className="underline underline-offset-4 decoration-[0.96px] px-0.5">
                Купон нэмэх
              </span>
            </button>
          </div>
        ) : (
          <>
            {filteredCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
            {activeTab === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center px-3 mt-7 py-2.5 gap-0.5 text-text-primary font-normal text-base font-manrope cursor-pointer"
              >
                <Plus />
                <span className="underline underline-offset-4 decoration-[0.96px] px-0.5">
                  Купон нэмэх
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <AddCouponModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetch}
      />
    </div>
  );
};
