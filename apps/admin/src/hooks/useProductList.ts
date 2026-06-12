"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { buildProductServerFilters, SORT_ORDER_MAP } from "./_productListFilters";
import { useProductListParams } from "./_useProductListParams";
import { useDebounce } from "./useDebounce";
import { useResetPage } from "./useResetPage";

import type { Product } from "@/components/product/types";

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

export function useProductList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const p = useProductListParams();
  const debouncedSearch = useDebounce(p.searchQuery);

  // Reset page on filter/search/sort/pageSize change (skip initial mount)
  useResetPage(
    () => p.setPage(1),
    [
      debouncedSearch,
      p.statusFilter,
      p.stockFilter,
      p.discountFilter,
      p.categoryFilter,
      p.brandFilter,
      p.sortOption,
      p.dateFrom,
      p.dateTo,
      p.pageSize,
    ],
  );

  // Clear row selection on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRowSelection({});
  }, [p.page]);

  const serverFilters = buildProductServerFilters({
    debouncedSearch,
    statusFilter: p.statusFilter,
    stockFilter: p.stockFilter,
    discountFilter: p.discountFilter,
    categoryFilter: p.categoryFilter,
    brandFilter: p.brandFilter,
    dateFrom: p.dateFrom,
    dateTo: p.dateTo,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.lists({
      page: p.page,
      pageSize: p.pageSize,
      search: debouncedSearch,
      status: p.statusFilter,
      stock: p.stockFilter,
      discount: p.discountFilter,
      category: p.categoryFilter,
      brand: p.brandFilter,
      sort: p.sortOption,
      dateFrom: p.dateFrom,
      dateTo: p.dateTo,
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
        order: SORT_ORDER_MAP[p.sortOption],
        limit: p.pageSize,
        offset: (p.page - 1) * p.pageSize,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const products = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / p.pageSize) : 1;

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
    filteredProducts: products,
    isLoading,
    searchQuery: p.searchQuery,
    setSearchQuery: p.setSearchQuery,
    statusFilter: p.statusFilter,
    setStatusFilter: p.setStatusFilter,
    stockFilter: p.stockFilter,
    setStockFilter: p.setStockFilter,
    discountFilter: p.discountFilter,
    setDiscountFilter: p.setDiscountFilter,
    categoryFilter: p.categoryFilter,
    setCategoryFilter: p.setCategoryFilter,
    brandFilter: p.brandFilter,
    setBrandFilter: p.setBrandFilter,
    sortOption: p.sortOption,
    setSortOption: p.setSortOption,
    dateFrom: p.dateFrom,
    setDateFrom: p.setDateFrom,
    dateTo: p.dateTo,
    setDateTo: p.setDateTo,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page: p.page,
    setPage: p.setPage,
    pageSize: p.pageSize,
    setPageSize: p.setPageSize,
    totalCount,
    totalPages,
    rowSelection,
    setRowSelection,
    selectedCount,
  };
}
