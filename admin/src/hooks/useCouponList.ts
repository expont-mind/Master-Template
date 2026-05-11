"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Coupon } from "@/components/coupon/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useCouponList() {
  const queryClient = useQueryClient();

  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    type: "all",
    status: "all",
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const typeFilter = params.type;
  const setTypeFilter = (v: string) => setParam("type", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch, typeFilter, statusFilter]);

  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["code.ilike"] = `%${debouncedSearch}%`;
  if (typeFilter !== "all") serverFilters["type.eq"] = typeFilter;
  if (statusFilter === "active") serverFilters["is_active.eq"] = "true";
  if (statusFilter === "inactive") serverFilters["is_active.eq"] = "false";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.coupons.lists({ page, search: debouncedSearch, type: typeFilter, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<Coupon>("coupons", {
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const coupons = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredCoupons = coupons;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("coupons", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.update("coupons", id, {
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await toggleActiveMutation.mutateAsync({ id, isActive });
  };

  return {
    coupons,
    filteredCoupons,
    isLoading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    handleDelete,
    handleToggleActive,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
