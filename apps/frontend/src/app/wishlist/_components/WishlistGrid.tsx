"use client";

import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { Slash } from "@/components/svg";
import { MutedTextSm, PrimaryMediumBase, PrimarySm } from "@/components/ui/typography";
import { ClearWishlistModal } from "@/components/wishlist/ClearWishlistModal";

import type { Product } from "@/types/database";

interface WishlistGridProps {
  items: Product[];
  showClearModal: boolean;
  onOpenClearModal: () => void;
  onCloseClearModal: () => void;
  onClearWishlist: () => void;
}

export function WishlistGrid({
  items,
  showClearModal,
  onOpenClearModal,
  onCloseClearModal,
  onClearWishlist,
}: WishlistGridProps) {
  return (
    <>
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <div className="px-0.5 pb-0 md:pb-2 pt-5 md:pt-[52px]">
          <div className="items-center gap-1.5 flex md:hidden">
            <Link href="/profile">
              <MutedTextSm>Профайл</MutedTextSm>
            </Link>
            <Slash />
            <PrimarySm>Хадгалсан</PrimarySm>
          </div>
          <p className="text-text-primary font-bold text-2xl md:text-xl md:text-[26px] leading-9 font-manrope">
            Хадгалсан
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <div className="items-center justify-between pb-4 hidden md:flex">
            <div className="flex items-center gap-1">
              <p className="text-text-primary font-black text-base font-manrope">{items.length}</p>
              <PrimaryMediumBase>Бүтээгдэхүүн</PrimaryMediumBase>
            </div>
            <button
              type="button"
              onClick={onOpenClearModal}
              className="text-text-secondary font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer hover:text-text-primary transition-colors duration-200 whitespace-nowrap"
            >
              Хадгалсан цэвэрлэх
            </button>
          </div>
          <div className="py-2 hidden md:block">
            <div className="w-full h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} fillParent />
            ))}
          </div>
        </div>
      </div>
      <ClearWishlistModal
        isOpen={showClearModal}
        onClose={onCloseClearModal}
        onConfirm={onClearWishlist}
      />
    </>
  );
}
