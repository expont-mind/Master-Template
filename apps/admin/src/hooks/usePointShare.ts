"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useDebounce } from "./useDebounce";
import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

import type { PointTransaction } from "@/components/point/types";

const PAGE_SIZE = 20;

export function usePointShare() {
  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch]);

  const serverFilters: Record<string, string> = {
    "type.eq": "promotional",
  };
  if (debouncedSearch) serverFilters["search"] = debouncedSearch.trim();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pointTransactions.lists({ page, search: debouncedSearch }),
    queryFn: () =>
      adminApi.getAllPaginated<PointTransaction>("point_transactions", {
        select: "*, users(id, first_name, last_name, email, primary_phone)",
        filters: serverFilters,
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const transactions = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  return {
    transactions,
    isLoading,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
