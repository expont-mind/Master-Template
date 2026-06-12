"use client";

import { KpiCard } from "./KpiCard";

import type { KpiItem } from "@/components/analytics/business/types";

const KPI_SKELETON_IDS = ["k1", "k2", "k3", "k4"] as const;

interface TabKpiGridProps {
  items: KpiItem[];
  isLoading: boolean;
}

export function TabKpiGrid({ items, isLoading }: TabKpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI_SKELETON_IDS.map((id) => (
          <div key={id} className="h-[120px] w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <KpiCard
          key={item.title}
          title={item.title}
          value={item.value}
          change={item.change}
          icon={item.icon}
          iconColor={item.iconColor}
        />
      ))}
    </div>
  );
}
