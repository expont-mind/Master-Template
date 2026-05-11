"use client";

import Link from "next/link";
import { ShoppingCart } from "@/components/svg";
import { MutedText, PrimaryMediumBase } from "@/components/ui/typography";

/**
 * Rendered when the cart store has hydrated but contains zero items.
 * Desktop shows the empty header + product count row (always "0");
 * mobile drops the header and centers the empty-state messaging.
 */
export function CartEmptyState() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope w-full hidden md:block">
          Сагс
        </p>

        <div className="pt-[152px] md:pt-7 flex flex-col gap-8 md:gap-[88px] w-full">
          <div className="flex-col gap-4 hidden md:flex">
            <div className="flex items-center gap-1">
              <p className="text-[#020617] font-black text-base font-manrope">
                0
              </p>
              <PrimaryMediumBase>Бүтээгдэхүүн</PrimaryMediumBase>
            </div>
            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="py-2">
                <ShoppingCart />
              </div>
              <MutedText>Одоогоор бүтээгдэхүүн сагслаагүй байна</MutedText>
            </div>

            <Link
              href="/products"
              className="px-3 max-w-[154px] w-full h-10 py-1 flex items-center justify-center rounded-sm border border-[#E2E8F0] text-[#020617] font-normal text-sm font-manrope transition-colors duration-200 hover:bg-surface"
            >
              Дэлгүүр хэсэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
