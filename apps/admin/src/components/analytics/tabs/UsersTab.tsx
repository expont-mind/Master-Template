"use client";

import { Users, UserCheck, Coins, Trophy } from "lucide-react";

import { UserGrowthChart } from "@/components/analytics/business/UserGrowthChart";
import { PointBalanceDistribution } from "@/components/analytics/charts/PointBalanceDistribution";
import { ReturningVsNewChart } from "@/components/analytics/charts/ReturningVsNewChart";
import { StatusDistributionDonut } from "@/components/analytics/charts/StatusDistributionDonut";
import { pctChange } from "@/components/analytics/shared/KpiCard";
import { TabKpiGrid } from "@/components/analytics/shared/TabKpiGrid";
import { TopSpendersTable } from "@/components/analytics/tables/TopSpendersTable";
import { useUsersTab } from "@/hooks/analytics/useUsersTab";

import type { KpiItem } from "@/components/analytics/business/types";
import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";

interface UsersTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function UsersTab({ dateRange, isActive }: UsersTabProps) {
  const data = useUsersTab(dateRange, isActive);

  const topSpenderAmount =
    data.topSpenders.length > 0 ? Number(data.topSpenders[0].total_spent) : 0;

  const kpis: KpiItem[] = [
    {
      title: "Нийт хэрэглэгч",
      value: data.totalUsers.toLocaleString(),
      change: pctChange(data.newUsers, data.prevNewUsers),
      icon: Users,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Идэвхтэй хэрэглэгч",
      value: data.activeUsers.toLocaleString(),
      icon: UserCheck,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Дундаж оноо",
      value: `₮${Math.round(data.avgPointBalance).toLocaleString()}`,
      icon: Coins,
      iconColor: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Шилдэг зарцуулалт",
      value: `₮${topSpenderAmount.toLocaleString()}`,
      icon: Trophy,
      iconColor: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <TabKpiGrid items={kpis} isLoading={data.isLoading} />

      <UserGrowthChart
        data={data.usersByDay}
        totalUsers={data.totalUsers}
        activeUsers={data.activeUsers}
        isLoading={data.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusDistributionDonut data={data.statusDist} isLoading={data.isLoading} />
        <PointBalanceDistribution data={data.pointBuckets} isLoading={data.isLoading} />
      </div>

      <ReturningVsNewChart data={data.returningData} isLoading={data.returningLoading} />

      <TopSpendersTable data={data.topSpenders} isLoading={data.topSpendersLoading} />
    </div>
  );
}
