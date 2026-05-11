"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ORDER_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
} from "@/constants";

interface OrderFunnelProps {
  ordersByStatus: Record<string, number>;
  deliveryFunnel: Record<string, number>;
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
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function OrderFunnel({
  ordersByStatus,
  deliveryFunnel,
  totalOrders,
  isLoading,
}: OrderFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Захиалгын урсгал</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    canceled: "bg-red-500",
  };

  const deliveryColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    shipped: "bg-purple-500",
    delivered: "bg-green-500",
    canceled: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Захиалгын урсгал</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Захиалгын төлөв
          </p>
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
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Хүргэлтийн төлөв
          </p>
          {Object.entries(DELIVERY_STATUS_LABELS).map(([key, label]) => (
            <FunnelBar
              key={key}
              label={label}
              count={deliveryFunnel[key] ?? 0}
              max={totalOrders}
              color={deliveryColors[key] ?? "bg-gray-500"}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
