"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import { Notification } from "@/components/notification/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

const PAGE_SIZE = 20;

export function useNotificationList() {
  const queryClient = useQueryClient();

  const { params, setParam } = useTableParams({
    page: 1,
    type: "all",
    read: "all",
  });

  const typeFilter = params.type;
  const setTypeFilter = (v: string) => setParam("type", v);
  const readFilter = params.read;
  const setReadFilter = (v: string) => setParam("read", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  useResetPage(() => setPage(1), [typeFilter, readFilter]);

  const serverFilters: Record<string, string> = {};
  if (typeFilter !== "all") serverFilters["type.eq"] = typeFilter;
  if (readFilter === "read") serverFilters["is_read.eq"] = "true";
  if (readFilter === "unread") serverFilters["is_read.eq"] = "false";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.lists({ page, type: typeFilter, read: readFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<Notification>("notifications", {
        select:
          "id, user_id, type, title, body, is_read, created_at, users(id, first_name, last_name, email)",
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const notifications = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const filteredNotifications = notifications;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("notifications", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    notifications,
    filteredNotifications,
    isLoading,
    typeFilter,
    setTypeFilter,
    readFilter,
    setReadFilter,
    handleDelete,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
