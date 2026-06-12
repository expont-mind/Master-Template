"use client";

import { useState } from "react";

import { ChevronDown } from "@/components/svg";

import { OrderCardItem } from "./OrderCardItem";

import type { ProfileOrder } from "@/app/profile/page";

type OrderItem = ProfileOrder["items"][number];

const COLLAPSED_ITEM_COUNT = 3;

interface OrderCardItemsProps {
  items: OrderItem[];
}

export const OrderCardItems = ({ items }: OrderCardItemsProps) => {
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const visibleItems = items.slice(0, COLLAPSED_ITEM_COUNT);
  const hiddenItems = items.slice(COLLAPSED_ITEM_COUNT);
  const hasMore = hiddenItems.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {visibleItems.map((item) => (
        <OrderCardItem key={item.id} item={item} />
      ))}

      {hasMore && (
        // -mb-3 when collapsed cancels the parent flex's gap-3 to the
        // toggle button below, so the only visible spacing is the gap
        // *above* this wrapper. Without this, an empty 0-height row
        // still contributes two 12px gaps (24px total) on each side.
        <div
          className={`grid transition-all duration-300 ease-out ${
            itemsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr] -mb-3"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3">
              {hiddenItems.map((item) => (
                <OrderCardItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setItemsExpanded((v) => !v);
          }}
          className="self-stretch flex items-center justify-center gap-1 px-3 py-2 border border-border rounded-sm text-text-primary font-normal text-sm font-manrope hover:bg-surface transition-colors cursor-pointer"
        >
          <span>{itemsExpanded ? "Хураах" : `Бүгдийг харах (${hiddenItems.length}+)`}</span>
          <span
            className={`flex items-center justify-center transition-transform duration-300 ${
              itemsExpanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown />
          </span>
        </button>
      )}
    </div>
  );
};
