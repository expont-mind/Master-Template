"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

interface UserRow {
  id: string;
  status: string;
  created_at: string;
}

interface PointTxRow {
  user_id: string;
  amount: number;
}

interface DayValue {
  date: string;
  value: number;
}

function aggregateByDay(
  items: { created_at: string }[],
  dateFrom: Date,
  dateTo: Date,
): DayValue[] {
  const map = new Map<string, number>();

  // Fill all dates
  const d = new Date(dateFrom);
  while (d <= dateTo) {
    map.set(d.toISOString().slice(0, 10), 0);
    d.setDate(d.getDate() + 1);
  }

  for (const item of items) {
    const key = item.created_at.slice(0, 10);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: date.slice(5), // "MM-DD"
      value,
    }));
}

export function useUserAnalytics() {
  // Current month range
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevTo = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data: usersResult, isLoading: isLoadingUsers } = useQuery({
    queryKey: [...queryKeys.analytics.all, "userAnalytics", "users"],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<UserRow>("users", {
        select: "id, status, created_at",
      }),
    staleTime: 5 * 60_000,
  });

  const { data: pointTxns = [], isLoading: isLoadingPoints } = useQuery({
    queryKey: [...queryKeys.analytics.all, "userAnalytics", "points"],
    queryFn: () =>
      adminApi.getAllBatched<PointTxRow>("point_transactions", {
        select: "user_id, amount",
      }),
    staleTime: 5 * 60_000,
  });

  const analytics = useMemo(() => {
    const users = usersResult?.data ?? [];
    const totalUsers = usersResult?.totalCount ?? users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.filter((u) => u.status === "inactive").length;
    const bannedUsers = users.filter((u) => u.status === "banned").length;

    // New users this period
    const fromStr = dateFrom.toISOString();
    const toStr = dateTo.toISOString();
    const prevFromStr = prevFrom.toISOString();
    const prevToStr = prevTo.toISOString();

    const newUsers = users.filter(
      (u) => u.created_at >= fromStr && u.created_at <= toStr,
    );
    const prevNewUsers = users.filter(
      (u) => u.created_at >= prevFromStr && u.created_at <= prevToStr,
    );

    // Growth chart
    const usersByDay = aggregateByDay(newUsers, dateFrom, dateTo);

    // Point balance distribution
    const balanceMap = new Map<string, number>();
    for (const tx of pointTxns) {
      balanceMap.set(tx.user_id, (balanceMap.get(tx.user_id) ?? 0) + tx.amount);
    }

    const pointBuckets = [
      { label: "0", min: -Infinity, max: 0, count: 0 },
      { label: "1-1,000", min: 1, max: 1000, count: 0 },
      { label: "1,001-5,000", min: 1001, max: 5000, count: 0 },
      { label: "5,001-10,000", min: 5001, max: 10000, count: 0 },
      { label: "10,000+", min: 10001, max: Infinity, count: 0 },
    ];

    for (const [, balance] of balanceMap) {
      for (const bucket of pointBuckets) {
        if (balance >= bucket.min && balance <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    // Average point balance
    const totalBalance = Array.from(balanceMap.values()).reduce(
      (sum, b) => sum + b,
      0,
    );
    const avgPointBalance =
      balanceMap.size > 0 ? Math.round(totalBalance / balanceMap.size) : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      bannedUsers,
      newUsersCount: newUsers.length,
      prevNewUsersCount: prevNewUsers.length,
      avgPointBalance,
      usersByDay,
      statusDistribution: [
        { name: "Идэвхтэй", value: activeUsers, color: "#10b981" },
        { name: "Идэвхгүй", value: inactiveUsers, color: "#9ca3af" },
        { name: "Хориглосон", value: bannedUsers, color: "#ef4444" },
      ],
      pointDistribution: pointBuckets.map((b) => ({
        name: b.label,
        value: b.count,
      })),
    };
  }, [usersResult, pointTxns, dateFrom, dateTo, prevFrom, prevTo]);

  return {
    ...analytics,
    isLoading: isLoadingUsers || isLoadingPoints,
  };
}
