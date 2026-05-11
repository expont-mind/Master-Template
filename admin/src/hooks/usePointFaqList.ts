"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { PointFaq } from "@/components/point/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function usePointFaqList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<PointFaq | null>(null);

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

  const serverFilters: Record<string, string> = {
    "category.eq": "point",
  };
  if (debouncedSearch) serverFilters["question.ilike"] = `%${debouncedSearch}%`;
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pointFaqs.lists({ page, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<PointFaq>("faqs", {
        order: "sort_order.asc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const faqs = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("faqs", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointFaqs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all });
    },
  });

  const handleDeleteClick = (faq: PointFaq) => {
    setDeleteTarget(faq);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    faqs,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
