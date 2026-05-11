export const revalidate = 30;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsOverview } from "@/components/analytics";
import { getMonthLabel } from "@/lib/utils/date-range";
import { Suspense } from "react";
import { getDashboardStats } from "@/components/dashboard/data";
import { getTodayDateMN } from "@/components/dashboard/helpers";
import {
  KpiStatCards,
  TodayHighlights,
  RecentOrders,
  RevenueTrendChart,
  TopSellingProducts,
  SmsBalanceCard,
  MonthSelector,
} from "@/components/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; from?: string; to?: string }>;
}) {
  const { month, from: fromParam, to: toParam } = await searchParams;
  const monthFilter = month || null;
  const dateRangeFilter =
    fromParam && toParam ? { from: fromParam, to: toParam } : null;
  const stats = await getDashboardStats(monthFilter, dateRangeFilter);

  const monthLabel = monthFilter
    ? getMonthLabel(monthFilter)
    : dateRangeFilter
      ? `${fromParam} — ${toParam}`
      : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Хяналтын самбар
          </h2>
          <p className="text-muted-foreground">
            {monthLabel || getTodayDateMN()}
          </p>
        </div>
        <Suspense fallback={null}>
          <MonthSelector />
        </Suspense>
      </div>

      {/* KPI Stat Cards + SMS Balance */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
        <div className="col-span-2 md:col-span-4">
          <KpiStatCards stats={stats} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <SmsBalanceCard
            balance={stats.smsBalance}
            spent={stats.smsTotalCost}
            sentCount={stats.sentSmsCount}
          />
        </div>
      </div>

      {/* Today's Highlights */}
      <TodayHighlights stats={stats} />

      {/* Recent Orders + Top Products */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentOrders
          orders={stats.recentOrders}
          isFiltered={stats.isFiltered}
        />
        <TopSellingProducts products={stats.topProducts} />
      </div>

      {/* Revenue Trend (full width) */}
      <Card>
        <CardHeader>
          <CardTitle>Орлогын чиг хандлага</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={stats.revenueByDay} />
        </CardContent>
      </Card>

      {/* Web Analytics */}
      <AnalyticsOverview />
    </div>
  );
}
