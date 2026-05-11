"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { Ad } from "@/components/ads/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useAdsList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);

  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    position: "all",
    status: "all",
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const positionFilter = params.position;
  const setPositionFilter = (v: string) => setParam("position", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch, positionFilter, statusFilter]);

  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["title.ilike"] = `%${debouncedSearch}%`;
  if (positionFilter !== "all") serverFilters["position.eq"] = positionFilter;
  if (statusFilter === "active") serverFilters["is_active.eq"] = "true";
  if (statusFilter === "inactive") serverFilters["is_active.eq"] = "false";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ads.lists({ page, search: debouncedSearch, position: positionFilter, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<Ad>("ads", {
        order: "sort_order.asc,created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const ads = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredAds = ads;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("ads", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    ads,
    filteredAds,
    isLoading,
    isDeleting: deleteMutation.isPending,
    searchQuery,
    setSearchQuery,
    positionFilter,
    setPositionFilter,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    setDeleteTarget,
    handleDelete,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.ads.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
