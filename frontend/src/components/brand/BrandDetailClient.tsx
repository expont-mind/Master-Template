"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useBrandProducts } from "@/lib/hooks/useBrands";
import { ProductCard } from "@/components/product/ProductCard";
import { SortDropdown, FilterPanel } from "@/components/category";
import { Slash, ChevronDownBig, SearchBig } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";
import type { ProductListItem } from "@/types/product";
import type { Product } from "@/types/database";
import { MutedText, PrimaryMediumSm, PrimarySm } from "@/components/ui/typography";

const PRODUCTS_PER_BATCH = 96; // 8 pages of 12 products

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  // Optional — not in the live schema today but kept for forward-compat
  // in case the admin gains banner/type fields later.
  banner_image?: string | null;
  type?: string | null;
  productCount?: number;
}

interface BrandDetailClientProps {
  slug: string;
  initialBrand: Brand;
}

interface BrandProductGridProps {
  products: ProductListItem[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

function BrandProductGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: BrandProductGridProps) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 w-full">
            <div className="w-full aspect-3/4 rounded-[4px] skeleton" />
            <div className="space-y-2">
              <div className="h-9 skeleton" />
              <div className="h-12 skeleton" />
              <div className="h-6 w-24 skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-[9px]">
          <SearchBig />
        </div>
        <MutedText>
          Бүтээгдэхүүн олдсонгүй
        </MutedText>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-2 md:py-0 gap-x-2 gap-y-6 md:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product as unknown as Product}
            fillParent
          />
        ))}
      </div>

      {/* Infinite scroll trigger with skeleton loading */}
      {shouldAutoFetch && (
        <div ref={loadMoreRef}>
          {isLoadingMore && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2.5 w-full">
                  <div className="w-full aspect-3/4 rounded-[4px] skeleton" />
                  <div className="space-y-2">
                    <div className="h-9 skeleton" />
                    <div className="h-12 skeleton" />
                    <div className="h-6 w-24 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Load more button - shown after 96 products */}
      {shouldShowButton && (
        <div className="px-4 py-5">
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

export function BrandDetailClient({
  slug,
  initialBrand,
}: BrandDetailClientProps) {
  const searchParams = useSearchParams();
  const brand = initialBrand;

  const sortParam = searchParams.get("sort") || "newest";
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock");

  const filters = useMemo(
    () => ({
      sort: sortParam,
      minPrice: minPriceParam ? Number(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      inStock: inStockParam === "true" ? true : undefined,
    }),
    [sortParam, minPriceParam, maxPriceParam, inStockParam],
  );

  const {
    data,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBrandProducts(slug, filters);

  // Flatten all pages into a single array
  const allProducts = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-20 md:pb-[52px] px-4 xl:px-0">
        {/* Breadcrumb */}
        <div className="flex flex-col py-2.5 md:pt-8 md:pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <Link
              href={ROUTES.BRANDS}
              className="text-[#64748B] font-normal text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
            >
              Бренд
            </Link>
            <Slash />
            <PrimarySm>
              {brand.name}
            </PrimarySm>
          </div>

          {/* Brand Name */}
          <h1 className="px-0.5 text-[#020617] font-bold text-[26px] leading-9 font-manrope tracking-[-0.26px] hidden md:block">
            {brand.name}
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {/* Banner Image */}
          {brand.banner_image && (
            <div className="relative w-full h-[200px] md:h-[358px] rounded-sm overflow-hidden">
              <Image
                src={brand.banner_image}
                alt={brand.name}
                fill
                className="object-cover object-center"
                sizes="1064px"
                quality={75}
                priority
              />
            </div>
          )}

          {/* Separator */}
          <div className="py-2 hidden md:block">
            <div className="w-full h-px bg-[#E2E8F0]" />
          </div>

          <div className="flex flex-col gap-0 md:gap-7">
            {/* Product Count + Sort/Filter */}
            <div className="flex items-center justify-between py-2.5 md:py-0">
              <div className="flex items-center gap-1 py-1">
                <p className="text-[#020617] font-semibold text-base font-manrope">
                  {total}
                </p>
                <PrimaryMediumSm>
                  бүтээгдэхүүн
                </PrimaryMediumSm>
              </div>

              <div className="flex gap-2">
                <SortDropdown />
                <FilterPanel />
              </div>
            </div>

            {/* Product Grid - 4 columns */}
            <BrandProductGrid
              products={allProducts}
              isLoading={productsLoading}
              onLoadMore={fetchNextPage}
              hasMore={hasNextPage ?? false}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
