"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "./types";

import type { DayValue } from "./types";

interface OrdersChartProps {
  data: DayValue[];
  isLoading: boolean;
}

export function OrdersChart({ data, isLoading }: OrdersChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Захиалгын тоо</CardTitle>
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
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
              <YAxis {...CHART_AXIS_STYLE} />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value) => [Number(value) || 0, "Захиалга"]}
              />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
