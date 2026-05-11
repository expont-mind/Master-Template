"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ChevronDown, ChevronUp, Users, UserPlus, TrendingUp, Coins } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "13px",
  },
};

const CHART_AXIS_STYLE = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
};

export function UserAnalyticsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const analytics = useUserAnalytics();

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <BarChart3 className="h-4 w-4" />
        Статистик харуулах
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  const {
    totalUsers,
    activeUsers,
    newUsersCount,
    prevNewUsersCount,
    avgPointBalance,
    usersByDay,
    statusDistribution,
    pointDistribution,
    isLoading,
  } = analytics;

  const newUsersDelta =
    prevNewUsersCount > 0
      ? Math.round(((newUsersCount - prevNewUsersCount) / prevNewUsersCount) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsOpen(false)}
        >
          <BarChart3 className="h-4 w-4" />
          Статистик нуух
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard
              title="Нийт хэрэглэгч"
              value={totalUsers.toLocaleString()}
              icon={Users}
            />
            <KpiCard
              title="Шинэ хэрэглэгч (энэ сар)"
              value={newUsersCount.toLocaleString()}
              delta={newUsersDelta}
              icon={UserPlus}
            />
            <KpiCard
              title="Идэвхтэй"
              value={activeUsers.toLocaleString()}
              icon={TrendingUp}
            />
            <KpiCard
              title="Дундаж Point"
              value={avgPointBalance.toLocaleString() + "P"}
              icon={Coins}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* User Growth */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Хэрэглэгчийн өсөлт</CardTitle>
              </CardHeader>
              <CardContent>
                {usersByDay.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                    Мэдээлэл байхгүй
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={usersByDay}>
                      <defs>
                        <linearGradient id="userAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
                      <YAxis {...CHART_AXIS_STYLE} allowDecimals={false} />
                      <Tooltip
                        {...CHART_TOOLTIP_STYLE}
                        formatter={(value: number | undefined) => [value ?? 0, "Шинэ хэрэглэгч"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        fill="url(#userAnalyticsGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Төлөв</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...CHART_TOOLTIP_STYLE}
                      formatter={(value: number | undefined, name: string | undefined) => [
                        (value ?? 0).toLocaleString(),
                        name ?? "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  {statusDistribution.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-muted-foreground">
                        {s.name} ({s.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Point Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Point үлдэгдлийн тархалт</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pointDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" {...CHART_AXIS_STYLE} />
                  <YAxis {...CHART_AXIS_STYLE} allowDecimals={false} />
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "Хэрэглэгч"]}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  delta,
  icon: Icon,
}: {
  title: string;
  value: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold">{value}</p>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`text-xs font-medium ${
                delta > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
