"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { Brand } from "@/components/brand/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useDebounce } from "./useDebounce";
import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

const PAGE_SIZE = 20;

export function useBrandList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { params, setParam } = useTableParams({ page: 1, search: "" });
  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch]);

  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["name.ilike"] = `%${debouncedSearch}%`;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.brands.lists({ page, search: debouncedSearch }),
    queryFn: () =>
      adminApi.getAllPaginated<Brand>("brands", {
        select: "id, name, logo_url",
        order: "name.asc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const brands = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredBrands = brands;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("brands", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });

  const handleDeleteClick = (brand: Brand) => {
    setDeleteTarget(brand);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  return {
    brands,
    filteredBrands,
    isLoading,
    isDeleting: deleteMutation.isPending,
    deleteTarget,
    searchQuery,
    setSearchQuery,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
