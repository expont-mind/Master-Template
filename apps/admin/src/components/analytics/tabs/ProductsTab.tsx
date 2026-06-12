"use client";

import { Package, Star, Award, MessageSquare } from "lucide-react";

import { ProductPerformanceTable } from "@/components/analytics/business/ProductPerformanceTable";
import { TabKpiGrid } from "@/components/analytics/shared/TabKpiGrid";
import { useProductsTab } from "@/hooks/analytics/useProductsTab";

import type { KpiItem } from "@/components/analytics/business/types";
import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";

interface ProductsTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function ProductsTab({ dateRange, isActive }: ProductsTabProps) {
  const data = useProductsTab(dateRange, isActive);

  const kpis: KpiItem[] = [
    {
      title: "Нийт бүтээгдэхүүн",
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Идэвхтэй",
      value: data.activeProducts.toLocaleString(),
      icon: Award,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Дундаж үнэлгээ",
      value: `${data.avgRating.toFixed(1)} / 5`,
      icon: Star,
      iconColor: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Нийт сэтгэгдэл",
      value: data.totalReviews.toLocaleString(),
      icon: MessageSquare,
      iconColor: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <TabKpiGrid items={kpis} isLoading={data.isLoading} />

      <ProductPerformanceTable
        dateFrom={dateRange.dateRange.from.toISOString()}
        dateTo={dateRange.dateRange.to.toISOString()}
      />
    </div>
  );
}
