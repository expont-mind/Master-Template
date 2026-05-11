"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDownBig } from "@/components/svg";
import { homeKeys, getNewProducts } from "@/lib/queries/home";
import type { Product } from "@/types/database";

const PRODUCTS_PER_BATCH = 96;

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

function ProductGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ProductGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [prevProductsLength, setPrevProductsLength] = useState(products.length);

  // Reset batch index when products reset (period change) - React recommended pattern
  if (products.length <= 12 && prevProductsLength > 12) {
    setBatchIndex(0);
    setPrevProductsLength(products.length);
  } else if (products.length !== prevProductsLength) {
    setPrevProductsLength(products.length);
  }

  // Calculate if we should auto-fetch or show button
  const currentBatchEnd = (batchIndex + 1) * PRODUCTS_PER_BATCH;
  const shouldAutoFetch = products.length < currentBatchEnd && hasMore;
  const shouldShowButton = products.length >= currentBatchEnd && hasMore;

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!shouldAutoFetch || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && shouldAutoFetch && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [shouldAutoFetch, isLoadingMore, isLoading, onLoadMore]);

  const handleLoadMoreClick = () => {
    setBatchIndex((prev) => prev + 1);
    onLoadMore();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 sm:gap-2.5 w-full">
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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[#64748B] font-normal text-base font-manrope">
          Бүтээгдэхүүн олдсонгүй
        </p>
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

      {/* Infinite scroll trigger with skeleton loading */}
      {shouldAutoFetch && (
        <div ref={loadMoreRef}>
          {isLoadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 sm:gap-2.5 w-full">
                  <div className="w-full h-[180px] sm:h-[240px] md:h-[340px] rounded-[4px] skeleton" />
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="h-8 sm:h-9 skeleton" />
                    <div className="h-10 sm:h-12 skeleton" />
                    <div className="h-5 sm:h-6 w-20 sm:w-24 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Load more button - shown after 96 products */}
      {shouldShowButton && (
        <div className="px-0 sm:px-4 py-4 sm:py-5">
          <button
            className="w-full px-3 py-3.5 border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-[2px] text-[#020617] font-normal text-lg font-manrope hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: homeKeys.newProducts("365d"),
      queryFn: ({ pageParam = 0 }) =>
        getNewProducts("365d", { limit: 12, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    });

  // Flatten all pages into a single array
  const allProducts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        <h1 className="px-0.5 pb-2 pt-4 md:pt-9 text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
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
