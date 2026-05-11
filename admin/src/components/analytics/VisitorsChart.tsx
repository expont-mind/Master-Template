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
import type { StatItem } from "./types";

interface VisitorsChartProps {
  data: StatItem[];
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

export function VisitorsChart({ data }: VisitorsChartProps) {
  const chartData = data.map((item) => ({
    date: formatDate(item.key),
    visitors: item.total,
  }));

  const isMobile = useIsMobile();
  // Mobile: show ~7 ticks max; Desktop: show all
  const tickInterval = isMobile && chartData.length > 8
    ? Math.ceil(chartData.length / 7) - 1
    : 0;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ right: 20 }}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="text-xs text-muted-foreground">
                      {payload[0]?.payload?.date}
                    </div>
                    <div className="text-sm font-bold">
                      {Number(payload[0]?.value).toLocaleString()} зочин
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}
