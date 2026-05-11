"use client";

import { BarChart3, Eye, Globe, Monitor, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DATE_RANGE_LABELS, type DateRange } from "./types";
import { VisitorsChart } from "./VisitorsChart";
import { TopPagesTable } from "./TopPagesTable";
import { DevicesPieChart } from "./DevicesPieChart";
import { CountriesCard } from "./CountriesCard";
import { ReferrersCard } from "./ReferrersCard";

export function AnalyticsOverview() {
  const { data, isLoading, error, dateRange, setDateRange } = useAnalytics();

  if (error) {
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

  return (
    <div className="space-y-4">
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

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хуудас үзэлт</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-lg sm:text-2xl font-bold">
                {data?.totals.pageViews.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              Сүүлийн {DATE_RANGE_LABELS[dateRange]}т
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Зочид</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-lg sm:text-2xl font-bold">
                {data?.totals.visitors.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              Сүүлийн {DATE_RANGE_LABELS[dateRange]}т
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visitors Chart */}
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

      {/* Details Grid */}
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
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
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
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <CountriesCard data={data?.countries ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referrers */}
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
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <ReferrersCard data={data?.topReferrers ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
