"use client";

import { Eye, Globe, Monitor, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CountriesCard } from "./CountriesCard";
import { DevicesPieChart } from "./DevicesPieChart";
import { ReferrersCard } from "./ReferrersCard";
import { TopPagesTable } from "./TopPagesTable";
import { DATE_RANGE_LABELS, type AnalyticsData, type DateRange } from "./types";
import { VisitorsChart } from "./VisitorsChart";

interface SummaryCardProps {
  label: string;
  icon: typeof Eye;
  value: number;
  dateRange: DateRange;
  isLoading: boolean;
}

function SummaryCard({ label, icon: Icon, value, dateRange, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="text-lg sm:text-2xl font-bold">{value.toLocaleString()}</div>
        )}
        <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
          Сүүлийн {DATE_RANGE_LABELS[dateRange]}т
        </p>
      </CardContent>
    </Card>
  );
}

export function AnalyticsSummaryStats({
  data,
  isLoading,
  dateRange,
}: {
  data: AnalyticsData | undefined;
  isLoading: boolean;
  dateRange: DateRange;
}) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2">
      <SummaryCard
        label="Хуудас үзэлт"
        icon={Eye}
        value={data?.totals.pageViews ?? 0}
        dateRange={dateRange}
        isLoading={isLoading}
      />
      <SummaryCard
        label="Зочид"
        icon={Users}
        value={data?.totals.visitors ?? 0}
        dateRange={dateRange}
        isLoading={isLoading}
      />
    </div>
  );
}

export function AnalyticsVisitorsChartCard({
  data,
  isLoading,
}: {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Зочдын тоо</CardTitle>
        <CardDescription>Өдөр тутмын зочдын статистик</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] w-full animate-pulse rounded bg-muted" />
        ) : (
          <VisitorsChart data={data?.visitors ?? []} />
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonRows({ count, height }: { count: number; height: string }) {
  const ids = Array.from({ length: count }, (_, i) => `skel-${i}`);
  return (
    <div className="space-y-2">
      {ids.map((id) => (
        <div key={id} className={`${height} animate-pulse rounded bg-muted`} />
      ))}
    </div>
  );
}

export function AnalyticsDetailsGrid({
  data,
  isLoading,
}: {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4" />
            Топ хуудсууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonRows count={5} height="h-8" />
          ) : (
            <TopPagesTable data={data?.topPages ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Monitor className="h-4 w-4" />
            Төхөөрөмж
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[150px] animate-pulse rounded bg-muted" />
          ) : (
            <DevicesPieChart data={data?.devices ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4" />
            Улс орнууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonRows count={5} height="h-6" />
          ) : (
            <CountriesCard data={data?.countries ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsReferrersCard({
  data,
  isLoading,
}: {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4" />
          Хандалтын эх үүсвэр
        </CardTitle>
        <CardDescription>Хэрэглэгчид хаанаас ирсэн</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SkeletonRows count={5} height="h-6" />
        ) : (
          <ReferrersCard data={data?.topReferrers ?? []} />
        )}
      </CardContent>
    </Card>
  );
}
