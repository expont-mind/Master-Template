"use client";

import { Package, PackageX, AlertTriangle } from "lucide-react";

import { InventoryAlerts } from "@/components/analytics/business/InventoryAlerts";
import { StockByCategory } from "@/components/analytics/charts/StockByCategory";
import { StockDistribution } from "@/components/analytics/charts/StockDistribution";
import { KpiCard } from "@/components/analytics/shared/KpiCard";
import { useInventoryTab } from "@/hooks/analytics/useInventoryTab";

import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";

interface InventoryTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function InventoryTab({ dateRange, isActive }: InventoryTabProps) {
  const data = useInventoryTab(dateRange, isActive);

  return (
    <div className="space-y-6 mt-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Нийт SKU"
          value={data.totalSkus.toLocaleString()}
          icon={Package}
          iconColor="bg-blue-100 text-blue-800"
          isLoading={data.isLoading}
        />
        <KpiCard
          title="Дууссан"
          value={data.outOfStock.toLocaleString()}
          icon={PackageX}
          iconColor="bg-red-100 text-red-800"
          isLoading={data.isLoading}
        />
        <KpiCard
          title="Бага нөөц (≤5)"
          value={data.lowStock.toLocaleString()}
          icon={AlertTriangle}
          iconColor="bg-yellow-100 text-yellow-800"
          isLoading={data.isLoading}
        />
      </div>

      <StockDistribution data={data.stockBuckets} isLoading={data.isLoading} />

      <InventoryAlerts alerts={data.inventoryAlerts} isLoading={data.isLoading} />

      <StockByCategory data={data.stockByCategory} isLoading={data.isLoading} />
    </div>
  );
}
