"use client";

import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalytics } from "@/hooks/useAnalytics";

import {
  AnalyticsDetailsGrid,
  AnalyticsReferrersCard,
  AnalyticsSummaryStats,
  AnalyticsVisitorsChartCard,
} from "./_AnalyticsOverviewSections";
import { DATE_RANGE_LABELS, type DateRange } from "./types";

function AnalyticsErrorState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Вэб аналитик
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          Аналитик ачаалахад алдаа гарлаа. ANALYTICS_PROJECT_ID тохируулсан эсэхийг шалгана уу.
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsHeader({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange;
  setDateRange: (v: DateRange) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
        Вэб аналитик
      </h3>
      <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DATE_RANGE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AnalyticsOverview() {
  const { data, isLoading, error, dateRange, setDateRange } = useAnalytics();

  if (error) {
    return <AnalyticsErrorState />;
  }

  return (
    <div className="space-y-4">
      <AnalyticsHeader dateRange={dateRange} setDateRange={setDateRange} />
      <AnalyticsSummaryStats data={data} isLoading={isLoading} dateRange={dateRange} />
      <AnalyticsVisitorsChartCard data={data} isLoading={isLoading} />
      <AnalyticsDetailsGrid data={data} isLoading={isLoading} />
      <AnalyticsReferrersCard data={data} isLoading={isLoading} />
    </div>
  );
}
