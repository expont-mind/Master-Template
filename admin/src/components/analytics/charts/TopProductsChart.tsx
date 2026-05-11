"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "@/components/analytics/shared/ChartCard";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/components/analytics/business/types";

interface TopProductsChartProps {
  data: { name: string; revenue: number }[];
  isLoading: boolean;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  return (
    <ChartCard title="Шилдэг 5 бүтээгдэхүүн" isLoading={isLoading} isEmpty={data.length === 0} height={260}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            {...CHART_AXIS_STYLE}
            tickFormatter={(v: number) => `₮${(v / 1000).toFixed(0)}K`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            {...CHART_AXIS_STYLE}
            tick={{ ...CHART_AXIS_STYLE.tick, fontSize: 11 }}
          />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value: number | undefined) => [`₮${(value ?? 0).toLocaleString()}`, "Орлого"]}
          />
          <Bar dataKey="revenue" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
