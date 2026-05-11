"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { DeliveryZone } from "@/components/delivery/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const PAGE_SIZE = 20;

export function useDeliveryList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);

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
    queryKey: queryKeys.deliveryZones.lists({ page, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<DeliveryZone>("delivery_zones", {
        select:
          "id, name, description, delivery_fee, free_delivery_threshold, is_free_delivery_enabled, estimated_days_min, estimated_days_max, is_active, sort_order, created_at, updated_at",
        order: "sort_order.asc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const zones = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredZones = zones;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("delivery_zones", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryZones.all });
    },
  });

  const handleDeleteClick = (zone: DeliveryZone) => {
    setDeleteTarget(zone);
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
    zones,
    filteredZones,
    isLoading,
    isDeleting: deleteMutation.isPending,
    deleteTarget,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
