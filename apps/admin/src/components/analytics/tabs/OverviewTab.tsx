"use client";

import { DollarSign, ShoppingCart, UserPlus, TrendingUp } from "lucide-react";

import { OrdersChart } from "@/components/analytics/business/OrdersChart";
import { RevenueChart } from "@/components/analytics/business/RevenueChart";
import { UserGrowthChart } from "@/components/analytics/business/UserGrowthChart";
import { TopProductsChart } from "@/components/analytics/charts/TopProductsChart";
import { pctChange } from "@/components/analytics/shared/KpiCard";
import { TabKpiGrid } from "@/components/analytics/shared/TabKpiGrid";
import { useOverviewTab } from "@/hooks/analytics/useOverviewTab";

import type { KpiItem } from "@/components/analytics/business/types";
import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";

interface OverviewTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function OverviewTab({ dateRange, isActive }: OverviewTabProps) {
  const data = useOverviewTab(dateRange, isActive);

  const kpis: KpiItem[] = [
    {
      title: "Нийт орлого",
      value: `₮${data.totalRevenue.toLocaleString()}`,
      change: pctChange(data.totalRevenue, data.prevRevenue),
      icon: DollarSign,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Захиалга",
      value: data.totalOrders.toLocaleString(),
      change: pctChange(data.totalOrders, data.prevOrders),
      icon: ShoppingCart,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Шинэ хэрэглэгч",
      value: data.newUsers.toLocaleString(),
      change: pctChange(data.newUsers, data.prevNewUsers),
      icon: UserPlus,
      iconColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Дундаж захиалга",
      value: `₮${Math.round(data.averageOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      iconColor: "bg-orange-100 text-orange-800",
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <TabKpiGrid items={kpis} isLoading={data.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={data.revenueByDay} isLoading={data.isLoading} />
        <OrdersChart data={data.ordersByDay} isLoading={data.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart
          data={data.usersByDay}
          totalUsers={0}
          activeUsers={0}
          isLoading={data.isLoading}
        />
        <TopProductsChart data={data.topProducts} isLoading={data.isLoading} />
      </div>
    </div>
  );
}
