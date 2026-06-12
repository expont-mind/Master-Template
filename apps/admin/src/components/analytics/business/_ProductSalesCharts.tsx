"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from "./types";

interface DayValue {
  date: string;
  value: number;
}

export function ProductRevenueChart({ data }: { data: DayValue[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Орлогын чиг хандлага</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="prodRevenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#prodRevenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductQtyChart({ data }: { data: DayValue[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Зарагдсан тоо хэмжээ</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
              <YAxis {...CHART_AXIS_STYLE} />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value) => [Number(value) || 0, "Тоо ширхэг"]}
              />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
