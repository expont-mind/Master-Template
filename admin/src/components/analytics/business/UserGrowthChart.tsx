"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DayValue } from "./types";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "./types";

interface UserGrowthChartProps {
  data: DayValue[];
  totalUsers: number;
  activeUsers: number;
  isLoading: boolean;
}

export function UserGrowthChart({
  data,
  totalUsers,
  activeUsers,
  isLoading,
}: UserGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хэрэглэгчийн өсөлт</CardTitle>
        <CardDescription>
          Нийт: {totalUsers.toLocaleString()} · Идэвхтэй:{" "}
          {activeUsers.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
              <YAxis {...CHART_AXIS_STYLE} />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value: number | undefined) => [value ?? 0, "Шинэ хэрэглэгч"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-3)"
                fill="url(#userGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
