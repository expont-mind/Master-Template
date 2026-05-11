"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PAYMENT_METHOD_LABELS } from "@/constants";
import { CHART_TOOLTIP_STYLE, CHART_COLORS } from "./types";

interface PaymentBreakdownProps {
  data: Record<string, number>;
  isLoading: boolean;
}

export function PaymentBreakdown({ data, isLoading }: PaymentBreakdownProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name:
      PAYMENT_METHOD_LABELS[key as keyof typeof PAYMENT_METHOD_LABELS] ?? key,
    value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Төлбөрийн арга</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                {...CHART_TOOLTIP_STYLE}
                formatter={(value: number | undefined) => [value ?? 0, "Захиалга"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
