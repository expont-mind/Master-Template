"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { CHART_TOOLTIP_STYLE } from "@/components/analytics/business/types";
import { ChartCard } from "@/components/analytics/shared/ChartCard";

const STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  banned: "Хориглосон",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  inactive: "#94a3b8",
  banned: "#f43f5e",
};

interface StatusDistributionDonutProps {
  data: Record<string, number>;
  isLoading: boolean;
}

export function StatusDistributionDonut({ data, isLoading }: StatusDistributionDonutProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: STATUS_LABELS[key] ?? key,
    value,
    fill: STATUS_COLORS[key] ?? "#94a3b8",
  }));

  return (
    <ChartCard
      title="Хэрэглэгчийн төлөв"
      isLoading={isLoading}
      isEmpty={chartData.length === 0}
      height={280}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.fill} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value) => [Number(value) || 0, "Хэрэглэгч"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
