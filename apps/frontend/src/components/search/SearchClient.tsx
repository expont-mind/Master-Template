"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef } from "react";

import { SortDropdown, FilterPanel } from "@/components/category";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { ChevronDownBig, SearchBig } from "@/components/svg";
import { MutedText, PrimaryMediumSm } from "@/components/ui/typography";
import { useInfiniteScrollGrid } from "@/lib/hooks/useInfiniteScrollGrid";
import { useSearchProducts } from "@/lib/hooks/useSearchProducts";
import { logSearch } from "@/lib/queries/search";
import { log } from "@/lib/utils/logger";

import type { ProductFilters, ProductListItem } from "@/lib/queries/search";
import type { Product } from "@/types/database";

interface SearchProductGridProps {
  products: ProductListItem[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const SKELETON_GRID_IDS = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9"] as const;
const SKELETON_FILTER_IDS = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"] as const;

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
      {SKELETON_GRID_IDS.map((id) => (
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

function SearchProductGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: SearchProductGridProps) {
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

function SearchContent() {
  const searchParams = useSearchParams();
  const lastLoggedQuery = useRef<string>("");

  const filters: Omit<ProductFilters, "limit" | "offset"> = useMemo(
    () => ({
      search: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      inStock: searchParams.get("inStock") === "true" ? true : undefined,
      sort: searchParams.get("sort") ?? "relevance",
    }),
    [searchParams],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchProducts(filters);

  const allProducts = useMemo(() => {
    const flat = data?.pages.flatMap((page) => page.data) ?? [];
    const seen = new Set<string>();
    return flat.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data]);
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    if (!isLoading && data && filters.search && filters.search !== lastLoggedQuery.current) {
      lastLoggedQuery.current = filters.search;
      logSearch(filters.search, data.pages[0]?.total ?? 0).catch((err) =>
        log.error("search_log_failed", err),
      );
    }
  }, [isLoading, data, filters.search]);

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-20">
        <div className="py-2.5 md:pt-7 md:pb-2 flex items-center gap-4 lg:gap-16 px-4 xl:px-0">
          <h1 className="w-full px-1.5 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope tracking-[-0.26px] min-w-0 lg:shrink-0 line-clamp-2 md:line-clamp-1">
            &ldquo;{filters.search}&rdquo; хайлт
          </h1>
        </div>

        <div className="flex gap-4 lg:gap-16">
          <div className="hidden lg:block w-[280px] shrink-0">
            <SearchFilters filters={filters as ProductFilters} />
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between py-2.5 px-4 xl:px-0">
              <div className="flex items-center gap-1 py-1">
                <p className="text-text-primary font-semibold text-base font-manrope">{total}</p>
                <PrimaryMediumSm>бүтээгдэхүүн</PrimaryMediumSm>
              </div>

              <div className="flex gap-1.5 sm:gap-2">
                <SortDropdown />
                <FilterPanel />
              </div>
            </div>

            {filters.search ? (
              <SearchProductGrid
                products={allProducts}
                isLoading={isLoading}
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage ?? false}
                isLoadingMore={isFetchingNextPage}
              />
            ) : (
              <div className="col-span-2 flex flex-col gap-4 py-20 items-center justify-center">
                <div className="p-[9px]">
                  <SearchBig />
                </div>
                <p className="text-lg font-semibold text-text-primary font-manrope">Хайлт хийх</p>
                <p className="text-text-secondary font-normal text-base font-manrope text-center max-w-[300px]">
                  Бүтээгдэхүүний нэр, категори эсвэл түлхүүр үг оруулна уу.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchClient() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-white flex justify-center min-h-screen">
          <div className="flex flex-col max-w-[1064px] w-full pb-20 px-4 xl:px-0">
            <div className="pt-5 md:pt-7 pb-2">
              <div className="h-9 w-40 skeleton" />
            </div>
            <div className="flex gap-4 lg:gap-16">
              <div className="hidden lg:flex w-[280px] py-2.5 flex-col gap-2">
                {SKELETON_FILTER_IDS.map((id) => (
                  <div key={id} className="h-8 skeleton rounded-sm" />
                ))}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
                  {SKELETON_GRID_IDS.map((id) => (
                    <div key={id} className="flex flex-col gap-2 sm:gap-2.5 w-full">
                      <div className="w-full h-[180px] sm:h-[280px] md:h-[305px] rounded-[4px] skeleton" />
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="h-8 sm:h-9 skeleton" />
                        <div className="h-10 sm:h-12 skeleton" />
                        <div className="h-5 sm:h-6 w-20 sm:w-24 skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
