"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_PRODUCTS_PER_BATCH = 96;
const RESET_THRESHOLD = 12;

interface UseInfiniteScrollGridOptions {
  productCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  productsPerBatch?: number;
}

interface UseInfiniteScrollGridResult {
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  shouldAutoFetch: boolean;
  shouldShowButton: boolean;
  handleLoadMoreClick: () => void;
}

/**
 * Shared infinite-scroll bookkeeping for product grids.
 *
 * Auto-fetches via IntersectionObserver until `productsPerBatch` items are
 * loaded, then switches to a manual "Load more" button. Resets the batch
 * counter when the product list shrinks below RESET_THRESHOLD (filter / sort
 * / period change pattern used by Search, Category, BestSellers, NewArrivals).
 */
export function useInfiniteScrollGrid({
  productCount,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  productsPerBatch = DEFAULT_PRODUCTS_PER_BATCH,
}: UseInfiniteScrollGridOptions): UseInfiniteScrollGridResult {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [prevProductCount, setPrevProductCount] = useState(productCount);

  if (productCount <= RESET_THRESHOLD && prevProductCount > RESET_THRESHOLD) {
    setBatchIndex(0);
    setPrevProductCount(productCount);
  } else if (productCount !== prevProductCount) {
    setPrevProductCount(productCount);
  }

  const currentBatchEnd = (batchIndex + 1) * productsPerBatch;
  const shouldAutoFetch = productCount < currentBatchEnd && hasMore;
  const shouldShowButton = productCount >= currentBatchEnd && hasMore;

  useEffect(() => {
    if (!shouldAutoFetch || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [shouldAutoFetch, isLoadingMore, isLoading, onLoadMore]);

  const handleLoadMoreClick = () => {
    setBatchIndex((prev) => prev + 1);
    onLoadMore();
  };

  return { loadMoreRef, shouldAutoFetch, shouldShowButton, handleLoadMoreClick };
}
