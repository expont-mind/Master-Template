"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDownBig } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { useInfiniteScrollGrid } from "@/lib/hooks/useInfiniteScrollGrid";
import { homeKeys, getNewProducts } from "@/lib/queries/home";

import type { Product } from "@/types/database";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const SKELETON_IDS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
] as const;

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {SKELETON_IDS.map((id) => (
        <div key={id} className="flex flex-col gap-2 sm:gap-2.5 w-full">
          <div className="w-full h-[180px] sm:h-[240px] md:h-[340px] rounded-[4px] skeleton" />
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

function ProductGrid({
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <MutedText>Бүтээгдэхүүн олдсонгүй</MutedText>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} fillParent />
        ))}
      </div>

      {shouldAutoFetch && <div ref={loadMoreRef}>{isLoadingMore && <GridSkeleton />}</div>}

      {shouldShowButton && (
        <div className="px-0 sm:px-4 py-4 sm:py-5">
          <button
            className="w-full px-3 py-3.5 border border-border rounded-sm flex items-center justify-center gap-[2px] text-text-primary font-normal text-lg font-manrope hover:bg-surface transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

export function NewArrivalsClient() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: homeKeys.newProducts("365d"),
    queryFn: ({ pageParam = 0 }) => getNewProducts("365d", { limit: 12, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const allProducts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        <h1 className="px-0.5 pb-2 pt-4 md:pt-9 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Шинээр нэмэгдсэн
        </h1>

        <div className="flex flex-col gap-4 md:gap-7 pt-2 md:pt-7 pb-10">
          <ProductGrid
            products={allProducts}
            isLoading={isLoading}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage ?? false}
            isLoadingMore={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
}
