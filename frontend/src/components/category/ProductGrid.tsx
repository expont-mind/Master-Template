"use client";

import { useRef, useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDownBig, SearchBig } from "@/components/svg";
import type { ProductListItem } from "@/types/product";
import type { Product } from "@/types/database";

const PRODUCTS_PER_BATCH = 96; // 8 pages of 12 products

interface ProductGridProps {
  products: ProductListItem[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export function ProductGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ProductGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [prevProductsLength, setPrevProductsLength] = useState(products.length);

  // Reset batch index when products reset (filter/sort change) - React recommended pattern
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 sm:gap-2.5 w-full">
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

  if (products.length === 0) {
    return (
      <div className="col-span-2 flex flex-col gap-4 py-20 items-center justify-center">
        <div className="p-[9px]">
          <SearchBig />
        </div>
        <p className="text-[#64748B] font-normal text-base font-manrope">
          Хайлтад тохирох бүтээгдэхүүн олдсонгүй
        </p>
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

      {/* Infinite scroll trigger with skeleton loading */}
      {shouldAutoFetch && (
        <div ref={loadMoreRef}>
          {isLoadingMore && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 sm:gap-2.5 w-full">
                  <div className="w-full h-[228px] sm:h-[280px] md:h-[305px] rounded-[4px] skeleton" />
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
            className="w-full px-3 py-3 sm:py-3.5 border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-[2px] text-[#020617] font-normal text-base sm:text-lg font-manrope hover:bg-[#F8FAFC] transition-colors cursor-pointer min-h-[48px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
