"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { SmsCampaign } from "@/components/sms-campaign/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useSmsCampaignList() {
  const queryClient = useQueryClient();

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
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.smsCampaigns.lists({ page, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<SmsCampaign>("sms_campaigns", {
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const campaigns = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("sms_campaigns", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smsCampaigns.all });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    campaigns,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
