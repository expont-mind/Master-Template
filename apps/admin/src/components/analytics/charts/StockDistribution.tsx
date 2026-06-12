"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/components/analytics/business/types";
import { ChartCard } from "@/components/analytics/shared/ChartCard";

interface StockDistributionProps {
  data: { label: string; count: number }[];
  isLoading: boolean;
}

export function StockDistribution({ data, isLoading }: StockDistributionProps) {
  return (
    <ChartCard
      title="Нөөцийн тархалт"
      isLoading={isLoading}
      isEmpty={data.every((d) => d.count === 0)}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" {...CHART_AXIS_STYLE} />
          <YAxis {...CHART_AXIS_STYLE} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value) => [Number(value) || 0, "Бүтээгдэхүүн"]}
          />
          <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
