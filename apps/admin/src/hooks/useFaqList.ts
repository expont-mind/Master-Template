"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useDebounce } from "./useDebounce";
import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

import type { FAQ } from "@/components/faq/types";

const PAGE_SIZE = 20;

export function useFaqList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    status: "all",
    category: "all",
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const categoryFilter = params.category;
  const setCategoryFilter = (v: string) => setParam("category", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch, statusFilter, categoryFilter]);

  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["question.ilike"] = `%${debouncedSearch}%`;
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;
  if (categoryFilter !== "all") serverFilters["category.eq"] = categoryFilter;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.faqs.lists({
      page,
      search: debouncedSearch,
      status: statusFilter,
      category: categoryFilter,
    }),
    queryFn: () =>
      adminApi.getAllPaginated<FAQ>("faqs", {
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
  const filteredFaqs = faqs;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("faqs", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all });
    },
  });

  const handleDeleteClick = (faq: FAQ) => {
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
    filteredFaqs,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
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
