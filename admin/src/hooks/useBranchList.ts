"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { Branch } from "@/components/branch/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useBranchList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    status: "all",
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch, statusFilter]);

  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["name.ilike"] = `%${debouncedSearch}%`;
  if (statusFilter === "active") serverFilters["is_active.eq"] = "true";
  if (statusFilter === "inactive") serverFilters["is_active.eq"] = "false";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.branches.lists({ page, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<Branch>("branches", {
        order: "sort_order.asc,created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const branches = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredBranches = branches;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("branches", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    branches,
    filteredBranches,
    isLoading,
    isDeleting: deleteMutation.isPending,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    setDeleteTarget,
    handleDelete,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.branches.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
