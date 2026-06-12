"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDownBig, SearchBig } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { useInfiniteScrollGrid } from "@/lib/hooks/useInfiniteScrollGrid";

import type { Product } from "@/types/database";
import type { ProductListItem } from "@/types/product";

interface ProductGridProps {
  products: ProductListItem[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const;

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
      {SKELETON_KEYS.map((id) => (
        <div key={id} className="flex flex-col gap-2 sm:gap-2.5 w-full">
          <div className="w-full h-[228px] sm:h-[280px] md:h-[305px] rounded-[4px] skeleton" />
          <div className="space-y-1.5 sm:space-y-2">
            <div className="h-8 sm:h-9 skeleton" />
            <div className="h-10 sm:h-12 skeleton" />
            <div className="h-5 sm:h-6 w-20 sm:w-24 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ProductGridProps) {
  const { loadMoreRef, shouldAutoFetch, shouldShowButton, handleLoadMoreClick } =
    useInfiniteScrollGrid({
      productCount: products.length,
      isLoading,
      isLoadingMore,
      hasMore,
      onLoadMore,
    });

  if (isLoading) return <GridSkeleton />;

  if (products.length === 0) {
    return (
      <div className="col-span-2 flex flex-col gap-4 py-20 items-center justify-center">
        <div className="p-[9px]">
          <SearchBig />
        </div>
        <MutedText>Хайлтад тохирох бүтээгдэхүүн олдсонгүй</MutedText>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-6 sm:gap-4 py-2.5 px-4 xl:px-0">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product as unknown as Product}
            fillParent
            compactImage
          />
        ))}
      </div>

      {shouldAutoFetch && <div ref={loadMoreRef}>{isLoadingMore && <GridSkeleton />}</div>}

      {shouldShowButton && (
        <div className="px-0 sm:px-4 py-4 sm:py-5">
          <button
            className="w-full px-3 py-3 sm:py-3.5 border border-border rounded-sm flex items-center justify-center gap-[2px] text-text-primary font-normal text-base sm:text-lg font-manrope hover:bg-surface transition-colors cursor-pointer min-h-[48px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLoadMoreClick}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Уншиж байна..." : "Цааш нь үзэх"}
            {!isLoadingMore && <ChevronDownBig />}
          </button>
        </div>
      )}
    </>
  );
}
