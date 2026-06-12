"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyRevenue } from "./types";

interface RevenueTrendChartProps {
  data: DailyRevenue[];
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString + "T00:00:00+08:00");
  return date.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `₮${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `���${(value / 1_000).toFixed(0)}K`;
  return `₮${value}`;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const isMobile = useIsMobile();

  const chartData = data.map((item) => ({
    date: formatDateLabel(item.date),
    rawDate: item.date,
    revenue: item.revenue,
  }));

  const tickInterval = isMobile && chartData.length > 8 ? Math.ceil(chartData.length / 7) - 1 : 0;

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
        Орлогын мэдээлэл байхгүй
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ right: 20 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            interval={tickInterval}
            angle={isMobile ? -35 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 45 : 30}
            padding={{ right: 10 }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            tickFormatter={formatRevenue}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="text-xs text-muted-foreground">{payload[0]?.payload?.date}</div>
                    <div className="text-sm font-bold">
                      ₮{Number(payload[0]?.value).toLocaleString()}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
