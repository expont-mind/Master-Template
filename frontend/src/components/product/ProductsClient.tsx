"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import type { CategoryWithChildren } from "@/lib/queries/products";
import type { ProductFilters } from "@/types/product";
import {
  SortDropdown,
  FilterPanel,
  CategorySidebar,
  Breadcrumbs,
  SubcategoryTabs,
  ProductGrid,
} from "@/components/category";
import { PrimaryMediumSm } from "@/components/ui/typography";

function findInTree(
  cats: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren | null {
  for (const cat of cats) {
    if (cat.slug === slug) return cat;
    const found = findInTree(cat.children, slug);
    if (found) return found;
  }
  return null;
}

function findPath(
  cats: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren[] | null {
  for (const cat of cats) {
    if (cat.slug === slug) return [cat];
    if (cat.children.length > 0) {
      const childPath = findPath(cat.children, slug);
      if (childPath) return [cat, ...childPath];
    }
  }
  return null;
}

// Find the selected category only if it has children (for subcategory tabs)
function findParentWithChildren(
  cats: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren | null {
  const selected = findInTree(cats, slug);
  if (!selected || selected.children.length === 0) return null;
  return selected;
}

function ProductsPageContent() {
  const searchParams = useSearchParams();

  // Get all URL params
  const selectedSlug = searchParams.get("category");
  const sortParam = searchParams.get("sort") as ProductFilters["sort"] | null;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock");

  // Build filters from URL
  const filters: ProductFilters = useMemo(
    () => ({
      category: selectedSlug ?? undefined,
      sort: sortParam || undefined,
      minPrice: minPriceParam ? Number(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      inStock: inStockParam === "true" ? true : undefined,
    }),
    [selectedSlug, sortParam, minPriceParam, maxPriceParam, inStockParam],
  );

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const {
    data,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts(filters);

  // Flatten all pages into a single array
  const allProducts = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Calculate derived data
  const breadcrumbPath = selectedSlug
    ? findPath(categories, selectedSlug)
    : null;

  const parentWithChildren = selectedSlug
    ? findParentWithChildren(categories, selectedSlug)
    : null;

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-20">
        <div className="py-2.5 md:pt-7 md:pb-2 flex items-center gap-4 lg:gap-16 px-4 xl:px-0">
          <h1 className="lg:max-w-[280px] lg:w-full px-1.5 text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope tracking-[-0.26px] shrink-0 hidden md:block">
            Категори
          </h1>
          <Breadcrumbs breadcrumbPath={breadcrumbPath} />
        </div>

        <div className="flex gap-4 lg:gap-16">
          {/* Sidebar Categories — hidden on mobile */}
          <div className="hidden lg:block">
            <CategorySidebar
              categories={categories}
              isLoading={categoriesLoading}
            />
          </div>

          {/* Main Content */}
          <div className="flex flex-col flex-1">
            {/* Subcategory tabs */}
            {parentWithChildren && (
              <SubcategoryTabs
                parentCategory={parentWithChildren}
                selectedSlug={selectedSlug}
              />
            )}

            <div className="flex items-center justify-between py-2.5 px-4 xl:px-0">
              <div className="flex items-center gap-1 py-1">
                <p className="text-[#020617] font-semibold text-base font-manrope">
                  {total}
                </p>
                <PrimaryMediumSm>
                  бүтээгдэхүүн
                </PrimaryMediumSm>
              </div>

              <div className="flex gap-1.5 sm:gap-2">
                <SortDropdown />
                <FilterPanel />
              </div>
            </div>

            {/* Product Grid with Load More */}
            <ProductGrid
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

export function ProductsClient() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-white flex justify-center min-h-screen">
          <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
            <div className="pt-5 md:pt-7 pb-2">
              <div className="h-9 w-40 skeleton" />
            </div>
            <div className="flex gap-4 lg:gap-16">
              <div className="hidden lg:flex w-[280px] py-2.5 flex-col gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 skeleton rounded-sm"
                  />
                ))}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 py-2.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 sm:gap-2.5 w-full"
                    >
                      <div className="w-full h-[180px] sm:h-[280px] md:h-[340px] rounded-[4px] skeleton" />
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
      <ProductsPageContent />
    </Suspense>
  );
}
