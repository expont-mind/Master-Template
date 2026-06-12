"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STATUS_LABELS } from "@/constants";

interface OrderStatusFunnelProps {
  ordersByStatus: Record<string, number>;
  totalOrders: number;
  isLoading: boolean;
}

function FunnelBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  canceled: "bg-red-500",
};

export function OrderStatusFunnel({
  ordersByStatus,
  totalOrders,
  isLoading,
}: OrderStatusFunnelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Захиалгын төлөв</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[260px] w-full animate-pulse rounded bg-muted" />
        ) : (
          <div className="space-y-3">
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <FunnelBar
                key={key}
                label={label}
                count={ordersByStatus[key] ?? 0}
                max={totalOrders}
                color={statusColors[key] ?? "bg-gray-500"}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
