"use client";

import Image from "next/image";

import { formatPrice } from "@/lib/utils/formatters";

import type { ProfileOrder } from "@/app/profile/page";

type OrderItem = ProfileOrder["items"][number];

interface OrderCardItemProps {
  item: OrderItem;
}

export const OrderCardItem = ({ item }: OrderCardItemProps) => {
  return (
    <div className="flex gap-3 md:gap-10 items-start">
      <div className="flex-1 flex gap-2 items-center min-w-0">
        <div className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] rounded-[4px] border border-border-light bg-surface shrink-0 overflow-hidden relative">
          {item.products?.images?.[0] && (
            <Image
              src={item.products.images[0]}
              alt={item.products.name ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 60px, 76px"
              quality={90}
            />
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-text-primary font-normal text-sm font-manrope leading-5 truncate">
            {item.products?.name ?? "Бүтээгдэхүүн"}
          </p>
          {item.variant_name && (
            <div className="flex items-center py-0.5">
              <p className="text-text-secondary font-normal text-xs font-manrope leading-4 truncate">
                {item.variant_name}
              </p>
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <p className="text-text-primary font-medium text-xs font-manrope leading-5 tracking-[-0.48px]">
              {formatPrice(item.price)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-0.5 pr-1 text-text-primary font-normal text-sm font-manrope leading-5">
        <span>{item.quantity}</span>
        <span>x</span>
      </div>
    </div>
  );
};
