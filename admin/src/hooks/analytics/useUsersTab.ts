"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { aggregateByDay } from "@/hooks/useAnalyticsData";
import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { UserRow, ReturningVsNew, TopSpender, DayValue } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

interface PointTx { user_id: string; amount: number }

export function useUsersTab(dr: AnalyticsDateRange, isActive: boolean) {
  const dateFilters = useMemo(
    () => dr.isAllTime ? undefined : { "created_at.gte": dr.prevFromIso, "created_at.lt": dr.toIso },
    [dr.isAllTime, dr.prevFromIso, dr.toIso],
  );

  const usersQuery = useQuery({
    queryKey: [...queryKeys.analytics.users(dr.fromIso, dr.toIso), "users", dr.prevFromIso, dr.isAllTime],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<UserRow>("users", {
        select: "id,status,created_at",
        filters: dateFilters,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const pointsQuery = useQuery({
    queryKey: [...queryKeys.analytics.users(dr.fromIso, dr.toIso), "points"],
    queryFn: () =>
      adminApi.getAllBatched<PointTx>("point_transactions", {
        select: "user_id,amount",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const returningQuery = useQuery({
    queryKey: queryKeys.analytics.usersReturning(dr.fromIso, dr.toIso),
    queryFn: () =>
      adminApi.rpc<ReturningVsNew[]>("get_returning_vs_new_users", {
        p_date_from: dr.fromIso,
        p_date_to: dr.toIso,
      }),
    enabled: isActive && !dr.isAllTime,
    ...QUERY_CONFIG,
  });

  const topSpendersQuery = useQuery({
    queryKey: queryKeys.analytics.usersTopSpenders(dr.fromIso, dr.toIso),
    queryFn: () =>
      adminApi.rpc<TopSpender[]>("get_top_spenders", {
        p_date_from: dr.isAllTime ? null : dr.fromIso,
        p_date_to: dr.isAllTime ? null : dr.toIso,
        p_limit: 10,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = usersQuery.isLoading || pointsQuery.isLoading;

  const data = useMemo(() => {
    const usersResult = usersQuery.data;
    const allUsers = usersResult?.data ?? [];
    const allPoints = pointsQuery.data ?? [];

    const periodUsers = dr.isAllTime
      ? allUsers
      : allUsers.filter((u) => new Date(u.created_at) >= dr.from);
    const prevPeriodUsers = dr.isAllTime
      ? []
      : allUsers.filter((u) => new Date(u.created_at) < dr.from);

    const totalUsers = usersResult?.totalCount ?? allUsers.length;
    const activeUsers = allUsers.filter((u) => u.status === "active").length;
    const newUsers = periodUsers.length;
    const prevNewUsers = prevPeriodUsers.length;

    // Point balance per user
    const pointBalanceMap = new Map<string, number>();
    for (const tx of allPoints) {
      pointBalanceMap.set(tx.user_id, (pointBalanceMap.get(tx.user_id) ?? 0) + tx.amount);
    }
    const balances = Array.from(pointBalanceMap.values());
    const avgPointBalance = balances.length > 0
      ? balances.reduce((s, b) => s + b, 0) / balances.length
      : 0;

    // Status distribution
    const statusDist: Record<string, number> = {};
    for (const u of allUsers) {
      statusDist[u.status] = (statusDist[u.status] ?? 0) + 1;
    }

    // Point balance distribution histogram
    const pointBuckets = [
      { label: "0", min: -Infinity, max: 0, count: 0 },
      { label: "1-1,000", min: 1, max: 1000, count: 0 },
      { label: "1,001-5,000", min: 1001, max: 5000, count: 0 },
      { label: "5,001-10,000", min: 5001, max: 10000, count: 0 },
      { label: "10,000+", min: 10001, max: Infinity, count: 0 },
    ];
    for (const bal of balances) {
      for (const bucket of pointBuckets) {
        if (bal >= bucket.min && bal <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    const usersByDay: DayValue[] = aggregateByDay(
      periodUsers.map((u) => ({ created_at: u.created_at, value: 1 })),
      dr.periodDays,
    );

    return {
      totalUsers,
      activeUsers,
      newUsers,
      prevNewUsers,
      avgPointBalance,
      statusDist,
      pointBuckets,
      usersByDay,
    };
  }, [usersQuery.data, pointsQuery.data, dr.from, dr.isAllTime, dr.periodDays]);

  const returningData = returningQuery.data?.[0] ?? null;
  const topSpenders = topSpendersQuery.data ?? [];

  return {
    ...data,
    returningData,
    topSpenders,
    topSpendersLoading: topSpendersQuery.isLoading,
    returningLoading: returningQuery.isLoading,
    isLoading,
  };
}
