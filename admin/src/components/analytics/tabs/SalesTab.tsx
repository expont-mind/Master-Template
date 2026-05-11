"use client";

import { DollarSign, ShoppingCart, XCircle, TrendingUp } from "lucide-react";
import { TabKpiGrid } from "@/components/analytics/shared/TabKpiGrid";
import { pctChange } from "@/components/analytics/shared/KpiCard";
import { RevenueChart } from "@/components/analytics/business/RevenueChart";
import { PaymentBreakdown } from "@/components/analytics/business/PaymentBreakdown";
import { CategoryBreakdown } from "@/components/analytics/business/CategoryBreakdown";
import { OrderStatusFunnel } from "@/components/analytics/charts/OrderStatusFunnel";
import { DeliveryFunnel } from "@/components/analytics/charts/DeliveryFunnel";
import { OrderHeatmap } from "@/components/analytics/charts/OrderHeatmap";
import { useSalesTab } from "@/hooks/analytics/useSalesTab";
import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";
import type { KpiItem } from "@/components/analytics/business/types";

interface SalesTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function SalesTab({ dateRange, isActive }: SalesTabProps) {
  const data = useSalesTab(dateRange, isActive);

  const kpis: KpiItem[] = [
    {
      title: "Нийт орлого",
      value: `₮${data.totalRevenue.toLocaleString()}`,
      change: pctChange(data.totalRevenue, data.prevRevenue),
      icon: DollarSign,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Төлсөн захиалга",
      value: data.paidOrders.toLocaleString(),
      change: pctChange(data.paidOrders, data.prevPaidOrders),
      icon: ShoppingCart,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Цуцлалтын хувь",
      value: `${data.cancellationRate.toFixed(1)}%`,
      icon: XCircle,
      iconColor: "bg-red-100 text-red-800",
    },
    {
      title: "Дундаж захиалга",
      value: `₮${Math.round(data.averageOrderValue).toLocaleString()}`,
      change: pctChange(data.averageOrderValue, data.prevAov),
      icon: TrendingUp,
      iconColor: "bg-orange-100 text-orange-800",
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <TabKpiGrid items={kpis} isLoading={data.isLoading} />

      <RevenueChart data={data.revenueByDay} isLoading={data.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OrderStatusFunnel
          ordersByStatus={data.ordersByStatus}
          totalOrders={data.totalOrders}
          isLoading={data.isLoading}
        />
        <PaymentBreakdown data={data.paymentMethodBreakdown} isLoading={data.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DeliveryFunnel
          deliveryFunnel={data.deliveryFunnel}
          totalOrders={data.totalOrders}
          isLoading={data.isLoading}
        />
        <CategoryBreakdown data={data.categoryBreakdown} isLoading={data.isLoading} />
      </div>

      <OrderHeatmap data={data.heatmapData} isLoading={data.heatmapLoading} />
    </div>
  );
}
