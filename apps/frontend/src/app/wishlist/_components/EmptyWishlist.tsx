import Link from "next/link";

import { Heart } from "@/components/svg";
import { MutedText, PrimaryMediumBase } from "@/components/ui/typography";

export function EmptyWishlist({ itemsLength }: { itemsLength: number }) {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope w-full">
          Хадгалсан
        </p>
        <div className="pt-7 flex flex-col gap-8 md:gap-[88px] w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              <p className="text-text-primary font-black text-base font-manrope">{itemsLength}</p>
              <PrimaryMediumBase>Бүтээгдэхүүн</PrimaryMediumBase>
            </div>
            <div className="py-2">
              <div className="w-full h-px bg-border" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="py-2">
                <Heart />
              </div>
              <MutedText>Одоогоор бүтээгдэхүүн хадгалаагүй байна</MutedText>
            </div>
            <Link
              href="/products"
              className="px-3 max-w-[154px] w-full h-10 py-1 flex items-center justify-center rounded-sm border border-border text-text-primary font-normal text-sm font-manrope transition-colors duration-200 hover:bg-surface"
            >
              Дэлгүүр хэсэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
