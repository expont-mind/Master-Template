"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/components/analytics/business/types";
import { ChartCard } from "@/components/analytics/shared/ChartCard";

import type { ReturningVsNew } from "@/components/analytics/business/types";

const BAR_COLORS = ["var(--chart-2)", "var(--chart-4)"];

interface ReturningVsNewChartProps {
  data: ReturningVsNew | null;
  isLoading: boolean;
}

export function ReturningVsNewChart({ data, isLoading }: ReturningVsNewChartProps) {
  const chartData = data
    ? [
        { name: "Шинэ худалдан авагч", value: data.new_buyers },
        { name: "Буцсан худалдан авагч", value: data.returning_buyers },
      ]
    : [];

  return (
    <ChartCard
      title="Шинэ vs Буцсан худалдан авагч"
      isLoading={isLoading}
      isEmpty={!data}
      height={280}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            {...CHART_AXIS_STYLE}
            tick={{ ...CHART_AXIS_STYLE.tick, fontSize: 11 }}
          />
          <YAxis {...CHART_AXIS_STYLE} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value) => [Number(value) || 0, "Худалдан авагч"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={entry.name} fill={BAR_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
