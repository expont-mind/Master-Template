"use client";

import { More } from "@/components/svg";

import { useTransientMenu } from "./_useTransientMenu";

import type { StatusBadge } from "./_orderStatusResolver";

interface OrderDetailHeaderProps {
  orderNumber: string;
  badge: StatusBadge;
  isPaymentUnpaid: boolean;
  onRequestDelete?: () => void;
  onBack: () => void;
}

interface DeleteActionMenuProps {
  onDelete: () => void;
}

const DeleteActionMenu = ({ onDelete }: DeleteActionMenuProps) => {
  const { setIsMenuOpen, menuMounted, menuVisible, menuRef } = useTransientMenu();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-surface rounded transition-colors"
        aria-label="Цааш"
      >
        <More />
      </button>
      {menuMounted && (
        <div
          className={`absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] min-w-[120px] p-1 origin-top-right transition-[opacity,transform] duration-150 ease-out ${
            menuVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1"
          }`}
        >
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onDelete();
            }}
            className="w-full text-left px-2 py-1.5 text-sm text-text-primary font-normal font-manrope hover:bg-surface rounded transition-colors cursor-pointer"
          >
            Устгах
          </button>
        </div>
      )}
    </div>
  );
};

export const OrderDetailHeader = ({
  orderNumber,
  badge,
  isPaymentUnpaid,
  onRequestDelete,
  onBack,
}: OrderDetailHeaderProps) => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex flex-col px-0.5 pb-2 md:pb-3 pt-5 md:pt-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBack}
            className="text-text-secondary font-normal text-sm font-manrope leading-5 hover:text-text-primary cursor-pointer transition-colors"
          >
            Миний захиалгууд
          </button>
          <span className="text-text-muted font-normal text-sm font-manrope">/</span>
          <span className="text-text-primary font-normal text-sm font-manrope leading-5">
            {orderNumber}
          </span>
        </div>
        <p className="text-text-primary font-semibold text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
          [{orderNumber}] Захиалгын дэлгэрэнгүй
        </p>
      </div>

      {/* Order Progress header row */}
      <div className="flex items-center justify-between">
        <p className="text-text-primary font-medium text-base font-manrope leading-6">
          Захиалгын явц
        </p>

        <div className="flex items-center gap-2">
          <span
            className={`${badge.bg} ${badge.text} font-medium text-xs font-manrope leading-4 px-1.5 pt-0.5 pb-1 rounded-[28px]`}
          >
            {badge.label}
          </span>
          {isPaymentUnpaid && onRequestDelete && <DeleteActionMenu onDelete={onRequestDelete} />}
        </div>
      </div>
    </>
  );
};
