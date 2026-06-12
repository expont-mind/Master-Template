"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "./types";

import type { DayValue } from "./types";

interface RevenueChartProps {
  data: DayValue[];
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Орлогын чиг хандлага</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
              <YAxis
                {...CHART_AXIS_STYLE}
                tickFormatter={(v: number) => `₮${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value) => [`₮${(Number(value) || 0).toLocaleString()}`, "Орлого"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                fill="url(#revenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
