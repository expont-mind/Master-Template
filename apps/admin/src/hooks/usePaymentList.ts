"use client";

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { PaymentWithOrder } from "@/components/payment/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

const PAGE_SIZE = 20;

function paymentMatchesQuery(payment: PaymentWithOrder, q: string): boolean {
  const fullName = [payment.orders?.users?.first_name, payment.orders?.users?.last_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const fields = [
    payment.id,
    payment.order_id,
    payment.transaction_ref,
    payment.orders?.users?.email,
    payment.orders?.users?.primary_phone,
  ];
  if (fullName.includes(q)) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export function usePaymentList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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
    queryKey: queryKeys.payments.lists({ page, status: statusFilter, provider: providerFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<PaymentWithOrder>("payments", {
        select:
          "id, order_id, provider, amount, status, transaction_ref, created_at, updated_at, orders(id, user_id, status, total_amount, users(id, first_name, last_name, email, primary_phone))",
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const payments = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  // Client-side text search on the fetched page (joins prevent server-side search)
  const q = searchQuery.toLowerCase();
  const filteredPayments = q ? payments.filter((p) => paymentMatchesQuery(p, q)) : payments;

  const providers = [...new Set(payments.map((p) => p.provider))];

  return {
    payments,
    filteredPayments,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    providers,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
