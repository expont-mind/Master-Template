"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

const PAGE_SIZE = 30;

export interface PaymentLog {
  id: string;
  invoice_id: string | null;
  order_id: string | null;
  provider: string | null;
  event: string;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function usePaymentLogList() {
  const { params, setParam } = useTableParams({
    page: 1,
    status: "all",
    provider: "all",
  });

  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const providerFilter = params.provider;
  const setProviderFilter = (v: string) => setParam("provider", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  useResetPage(() => setPage(1), [statusFilter, providerFilter]);

  const serverFilters: Record<string, string> = {};
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;
  if (providerFilter !== "all") serverFilters["provider.eq"] = providerFilter;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.paymentLogs.lists({ page, status: statusFilter, provider: providerFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<PaymentLog>("payment_logs", {
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });

  const logs = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  return {
    logs,
    isLoading,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
