"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { User, UserWithStats } from "@/components/user/types";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "./useDebounce";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const DEFAULT_PAGE_SIZE = 20;

export function useUserList() {
  const { params, setParam } = useTableParams({
    page: 1,
    search: "",
    status: "all",
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const searchQuery = params.search;
  const setSearchQuery = (v: string) => setParam("search", v);
  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);
  const pageSize = params.pageSize;
  const setPageSize = (v: number) => setParam("pageSize", v);

  const debouncedSearch = useDebounce(searchQuery);

  useResetPage(() => setPage(1), [debouncedSearch, statusFilter, pageSize]);

  // ── Primary: RPC query (with stats) ──
  const rpcParams: Record<string, unknown> = {
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  };
  if (debouncedSearch) rpcParams.p_search = debouncedSearch.trim();
  if (statusFilter !== "all") rpcParams.p_status = statusFilter;

  const rpcQuery = useQuery({
    queryKey: [...queryKeys.users.all, "rpc", { page, pageSize, search: debouncedSearch, status: statusFilter }],
    queryFn: () => adminApi.rpc<UserWithStats[]>("get_users_with_stats", rpcParams),
    staleTime: 60_000,
    retry: false,
  });

  // ── Fallback: direct table query (when RPC not available) ──
  const serverFilters: Record<string, string> = {};
  if (debouncedSearch) serverFilters["search"] = debouncedSearch.trim();
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;

  const fallbackQuery = useQuery({
    queryKey: queryKeys.users.lists({ page, pageSize, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<User>("users", {
        select: "id, email, first_name, last_name, primary_phone, avatar_url, status, created_at",
        order: "created_at.desc",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: rpcQuery.isError,
  });

  // Fallback: client-side point balances
  const fallbackUserIds = (fallbackQuery.data?.data ?? []).map((u) => u.id);
  const { data: pointTxns = [] } = useQuery({
    queryKey: [...queryKeys.users.all, "point_balances", fallbackUserIds],
    queryFn: () =>
      adminApi.getAll<{ user_id: string; amount: number }>(
        "point_transactions",
        {
          select: "user_id, amount",
          filters: { "user_id.in": fallbackUserIds.join(",") },
        },
      ),
    enabled: rpcQuery.isError && fallbackUserIds.length > 0,
  });

  // ── Merge results ──
  const useRpc = rpcQuery.isSuccess && !rpcQuery.isError;

  const { filteredUsers, totalCount } = useMemo(() => {
    if (useRpc) {
      const rows = rpcQuery.data ?? [];
      return {
        filteredUsers: rows.map((r): User => ({
          id: r.id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          primary_phone: r.primary_phone,
          avatar_url: r.avatar_url,
          status: r.status as User["status"],
          created_at: r.created_at,
          point_activated_at: null,
          addresses: [],
          point_balance: r.point_balance,
          order_count: r.order_count,
          total_spent: r.total_spent,
        })),
        totalCount: rows.length > 0 ? rows[0].total_count : 0,
      };
    }

    // Fallback path
    const users = fallbackQuery.data?.data ?? [];
    const balanceMap = new Map<string, number>();
    for (const tx of pointTxns) {
      balanceMap.set(tx.user_id, (balanceMap.get(tx.user_id) ?? 0) + tx.amount);
    }
    return {
      filteredUsers: users.map((u): User => ({
        ...u,
        point_activated_at: null,
        addresses: [],
        point_balance: balanceMap.get(u.id) ?? 0,
      })),
      totalCount: fallbackQuery.data?.totalCount ?? 0,
    };
  }, [useRpc, rpcQuery.data, fallbackQuery.data, pointTxns]);

  const isLoading = useRpc ? rpcQuery.isLoading : (rpcQuery.isLoading || fallbackQuery.isLoading);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;

  return {
    users: filteredUsers,
    filteredUsers,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
    setPageSize,
  };
}
