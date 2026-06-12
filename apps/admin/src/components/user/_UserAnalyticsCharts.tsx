"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "13px",
  },
};

export const CHART_AXIS_STYLE = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
};

interface UsersByDayPoint {
  date: string;
  value: number;
}

interface StatusEntry {
  name: string;
  value: number;
  color: string;
}

interface PointDistributionEntry {
  name: string;
  value: number;
}

export function UserGrowthCard({ data }: { data: UsersByDayPoint[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Хэрэглэгчийн өсөлт</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
            Мэдээлэл байхгүй
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="userAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
              <YAxis {...CHART_AXIS_STYLE} allowDecimals={false} />
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value) => [Number(value) || 0, "Шинэ хэрэглэгч"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="url(#userAnalyticsGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusDistributionCard({ data }: { data: StatusEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Төлөв</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              formatter={(value, name) => [
                (Number(value) || 0).toLocaleString(),
                typeof name === "string" ? name : "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 text-xs">
          {data.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">
                {s.name} ({s.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PointDistributionCard({ data }: { data: PointDistributionEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Point үлдэгдлийн тархалт</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" {...CHART_AXIS_STYLE} />
            <YAxis {...CHART_AXIS_STYLE} allowDecimals={false} />
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              formatter={(value) => [(Number(value) || 0).toLocaleString(), "Хэрэглэгч"]}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
