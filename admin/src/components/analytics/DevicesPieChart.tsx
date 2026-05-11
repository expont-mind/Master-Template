"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatItem } from "./types";
import { DEVICE_LABELS } from "./types";

interface DevicesPieChartProps {
  data: StatItem[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export function DevicesPieChart({ data }: DevicesPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const chartData = data.map((item, index) => ({
    name: DEVICE_LABELS[item.key.toLowerCase()] || item.key,
    value: item.total,
    percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
    color: COLORS[index % COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Мэдээлэл байхгүй
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-[150px] w-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="text-sm font-medium">{data?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(data?.value).toLocaleString()} ({data?.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
