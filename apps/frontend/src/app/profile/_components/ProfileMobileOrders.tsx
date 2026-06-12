"use client";

import Image from "next/image";

import {
  filterOrderByTab,
  MOBILE_ORDER_EMPTY_STATES,
  MOBILE_ORDER_TABS,
} from "@/app/profile/_lib/mobileOrderFilters";
import { OrderCard } from "@/components/profile/OrderCard";
import { ChevronRight16Gray } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";

import type { ProfileOrder } from "@/app/profile/page";

interface ProfileMobileOrdersProps {
  orders: ProfileOrder[];
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  onAllOrders: () => void;
  onOrderClick: (orderId: string) => void;
}

export const ProfileMobileOrders = ({
  orders,
  activeTab,
  onTabChange,
  onAllOrders,
  onOrderClick,
}: ProfileMobileOrdersProps) => {
  const getMobileTabCount = (tabIndex: number) =>
    orders.filter((o) => filterOrderByTab(o, tabIndex)).length;
  const filtered = orders.filter((o) => filterOrderByTab(o, activeTab));

  return (
    <div className="lg:hidden">
      {/* Gray divider */}
      <div className="bg-surface h-2 -mx-4" />

      {/* Orders header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center py-0.5">
          <div className="ml-[-4px] w-8 h-8 relative">
            <Image src="/orders.png" alt="orders" fill className="object-contain" />
          </div>
          <p className="text-text-primary font-medium text-lg font-manrope">Сүүлийн захиалгууд</p>
        </div>
        <button onClick={onAllOrders} className="flex items-center gap-0.5 py-2 cursor-pointer">
          <span className="text-text-secondary font-medium text-sm font-manrope">Бүх захиалга</span>
          <ChevronRight16Gray />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 pt-2 pb-1 overflow-x-auto scrollbar-hide">
        {MOBILE_ORDER_TABS.map((tab, index) => {
          const count = getMobileTabCount(index);
          return (
            <div key={tab} className="relative w-full">
              <button
                onClick={() => onTabChange(index)}
                className={`w-full h-8 px-4 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors ${
                  index === activeTab
                    ? "bg-text-primary border-text-primary text-white font-medium"
                    : "bg-white border-border text-text-secondary hover:bg-surface"
                }`}
              >
                {tab}
              </button>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-text-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Order cards */}
      <div className="flex flex-col gap-5 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="p-[9px]">{MOBILE_ORDER_EMPTY_STATES[activeTab].icon}</div>
            <MutedText>{MOBILE_ORDER_EMPTY_STATES[activeTab].text}</MutedText>
          </div>
        ) : (
          filtered.map((order) => (
            <OrderCard key={order.id} order={order} onMoreClick={() => onOrderClick(order.id)} />
          ))
        )}
      </div>
    </div>
  );
};
