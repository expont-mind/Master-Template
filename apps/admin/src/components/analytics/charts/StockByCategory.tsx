"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/components/analytics/business/types";
import { ChartCard } from "@/components/analytics/shared/ChartCard";

interface StockByCategoryProps {
  data: { name: string; stock: number }[];
  isLoading: boolean;
}

export function StockByCategory({ data, isLoading }: StockByCategoryProps) {
  return (
    <ChartCard
      title="Категори тус бүрийн нөөц"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      height={Math.max(data.length * 45, 200)}
    >
      <ResponsiveContainer width="100%" height={Math.max(data.length * 45, 200)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" {...CHART_AXIS_STYLE} />
          <YAxis type="category" dataKey="name" width={120} {...CHART_AXIS_STYLE} />
          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [Number(value) || 0, "Нөөц"]} />
          <Bar dataKey="stock" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
