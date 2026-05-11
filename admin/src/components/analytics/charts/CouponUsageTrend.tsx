"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/analytics/shared/ChartCard";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/components/analytics/business/types";

interface CouponUsageTrendProps {
  data: { date: string; count: number }[];
  isLoading: boolean;
}

export function CouponUsageTrend({ data, isLoading }: CouponUsageTrendProps) {
  return (
    <ChartCard title="Купоны хэрэглээний чиг хандлага" isLoading={isLoading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
          <YAxis {...CHART_AXIS_STYLE} />
          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value: number | undefined) => [value ?? 0, "Хэрэглээ"]} />
          <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
