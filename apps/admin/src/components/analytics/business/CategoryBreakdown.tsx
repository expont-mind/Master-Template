"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "./types";

interface CategoryBreakdownProps {
  data: { name: string; revenue: number }[];
  isLoading: boolean;
}

export function CategoryBreakdown({ data, isLoading }: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Категори тус бүрийн борлуулалт</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(data.length * 45, 200)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                {...CHART_AXIS_STYLE}
                tickFormatter={(v: number) => `₮${(v / 1000).toFixed(0)}K`}
              />
              <YAxis type="category" dataKey="name" width={120} {...CHART_AXIS_STYLE} />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  `₮${(typeof value === "number" ? value : 0).toLocaleString()}`,
                  "Орлого",
                ]}
              />
              <Bar dataKey="revenue" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
