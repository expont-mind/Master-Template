"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Banner } from "@/components/banner/types";
import { queryKeys } from "@/lib/query-keys";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useBannerList() {
  const queryClient = useQueryClient();

  const { params, setParam } = useTableParams({
    page: 1,
    position: "all",
    status: "all",
  });

  const positionFilter = params.position;
  const setPositionFilter = (v: string) => setParam("position", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  useResetPage(() => setPage(1), [positionFilter, statusFilter]);

  const serverFilters: Record<string, string> = {};
  if (positionFilter !== "all") serverFilters["position.eq"] = positionFilter;
  if (statusFilter === "active") serverFilters["is_active.eq"] = "true";
  if (statusFilter === "inactive") serverFilters["is_active.eq"] = "false";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.banners.lists({ page, position: positionFilter, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<Banner>("banners", {
        order: "sort_order.asc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const banners = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredBanners = banners;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("banners", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.update("banners", id, {
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await toggleActiveMutation.mutateAsync({ id, isActive });
  };

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          adminApi.update("banners", id, {
            sort_order,
            updated_at: new Date().toISOString(),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
  });

  const handleReorder = async (updates: { id: string; sort_order: number }[]) => {
    await reorderMutation.mutateAsync(updates);
  };

  return {
    banners,
    filteredBanners,
    isLoading,
    positionFilter,
    setPositionFilter,
    statusFilter,
    setStatusFilter,
    handleDelete,
    handleToggleActive,
    handleReorder,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.banners.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
