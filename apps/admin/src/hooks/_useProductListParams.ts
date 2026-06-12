"use client";

import { useTableParams } from "./useTableParams";

import type { SortOption } from "./useProductList";

const DEFAULT_PAGE_SIZE = 20;

/**
 * URL-synced product list params: search, filters, sort, pagination.
 */
export function useProductListParams() {
  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    status: "all",
    stock: "all",
    discount: "all",
    category: "all",
    brand: "all",
    sort: "newest",
    dateFrom: "",
    dateTo: "",
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return {
    params,
    searchQuery: params.search,
    setSearchQuery: (v: string) => setParam("search", v),
    statusFilter: params.status,
    setStatusFilter: (v: string) => setParam("status", v),
    stockFilter: params.stock,
    setStockFilter: (v: string) => setParam("stock", v),
    discountFilter: params.discount,
    setDiscountFilter: (v: string) => setParam("discount", v),
    categoryFilter: params.category,
    setCategoryFilter: (v: string) => setParam("category", v),
    brandFilter: params.brand,
    setBrandFilter: (v: string) => setParam("brand", v),
    sortOption: params.sort as SortOption,
    setSortOption: (v: SortOption) => setParam("sort", v),
    dateFrom: params.dateFrom,
    setDateFrom: (v: string) => setParam("dateFrom", v),
    dateTo: params.dateTo,
    setDateTo: (v: string) => setParam("dateTo", v),
    page: params.page,
    setPage: (v: number) => setParam("page", v),
    pageSize: params.pageSize,
    setPageSize: (v: number) => setParam("pageSize", v),
  };
}
