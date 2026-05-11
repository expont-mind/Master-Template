"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { Product } from "@/components/product/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const DEFAULT_PAGE_SIZE = 20;

export type SortOption =
  | "newest"
  | "oldest"
  | "az"
  | "za"
  | "price_asc"
  | "price_desc"
  | "discount_asc"
  | "discount_desc"
  | "updated_desc"
  | "updated_asc";

const SORT_ORDER_MAP: Record<SortOption, string> = {
  newest: "created_at.desc",
  oldest: "created_at.asc",
  az: "name.asc",
  za: "name.desc",
  price_asc: "price.asc",
  price_desc: "price.desc",
  discount_asc: "discount_price.asc.nullslast",
  discount_desc: "discount_price.desc.nullslast",
  updated_desc: "updated_at.desc",
  updated_asc: "updated_at.asc",
};

export function useProductList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

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

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const stockFilter = params.stock;
  const setStockFilter = (v: string) => setParam("stock", v);
  const discountFilter = params.discount;
  const setDiscountFilter = (v: string) => setParam("discount", v);
  const categoryFilter = params.category;
  const setCategoryFilter = (v: string) => setParam("category", v);
  const brandFilter = params.brand;
  const setBrandFilter = (v: string) => setParam("brand", v);
  const sortOption = params.sort as SortOption;
  const setSortOption = (v: SortOption) => setParam("sort", v);
  const dateFrom = params.dateFrom;
  const setDateFrom = (v: string) => setParam("dateFrom", v);
  const dateTo = params.dateTo;
  const setDateTo = (v: string) => setParam("dateTo", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);
  const pageSize = params.pageSize;
  const setPageSize = (v: number) => setParam("pageSize", v);

  const debouncedSearch = useDebounce(searchQuery);

  // Reset page on filter/search/sort/pageSize change (skip initial mount)
  useResetPage(() => setPage(1), [debouncedSearch, statusFilter, stockFilter, discountFilter, categoryFilter, brandFilter, sortOption, dateFrom, dateTo, pageSize]);

  // Clear row selection on page change
  useEffect(() => {
    setRowSelection({});
  }, [page]);

  const serverFilters: Record<string, string> = {};
  // Use search_words for multi-word search (all words must match)
  if (debouncedSearch) serverFilters["search_words"] = debouncedSearch;
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;
  if (stockFilter === "out") serverFilters["stock_quantity.eq"] = "0";
  if (stockFilter === "low") { serverFilters["stock_quantity.lt"] = "10"; serverFilters["stock_quantity.gt"] = "0"; }
  if (stockFilter === "in_stock") serverFilters["stock_quantity.gte"] = "10";
  if (discountFilter === "has") serverFilters["discount_price.gt"] = "0";
  if (discountFilter === "none") {
    serverFilters["discount_price.is"] = "null";
  }
  if (categoryFilter !== "all") serverFilters["category_id"] = categoryFilter;
  if (brandFilter !== "all") serverFilters["brand_id.eq"] = brandFilter;
  if (dateFrom) serverFilters["created_at.gte"] = new Date(`${dateFrom}T00:00:00+08:00`).toISOString();
  if (dateTo) serverFilters["created_at.lte"] = new Date(`${dateTo}T23:59:59.999+08:00`).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.lists({
      page,
      pageSize,
      search: debouncedSearch,
      status: statusFilter,
      stock: stockFilter,
      discount: discountFilter,
      category: categoryFilter,
      brand: brandFilter,
      sort: sortOption,
      dateFrom,
      dateTo,
    }),
    queryFn: () =>
      adminApi.getAllPaginated<Product>("products", {
        select: `
          id,
          name,
          slug,
          description,
          price,
          discount_price,
          stock_quantity,
          status,
          brand_id,
          created_at,
          updated_at,
          brands (id, name),
          product_images (id, url, alt_text, is_primary, sort_order),
          product_categories (category_id, categories (id, name)),
          product_variants (id, price, discount_price, stock_quantity, is_default, status)
        `,
        order: SORT_ORDER_MAP[sortOption],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const products = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / pageSize) : 1;

  // Alias for backward compatibility
  const filteredProducts = products;

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("products", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    products,
    filteredProducts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    discountFilter,
    setDiscountFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    sortOption,
    setSortOption,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    rowSelection,
    setRowSelection,
    selectedCount,
  };
}
