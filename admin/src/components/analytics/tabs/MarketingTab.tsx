"use client";

import { Ticket, MessageSquare, Wallet, BadgePercent } from "lucide-react";
import { TabKpiGrid } from "@/components/analytics/shared/TabKpiGrid";
import { CouponUsageTrend } from "@/components/analytics/charts/CouponUsageTrend";
import { TopCouponsTable } from "@/components/analytics/tables/TopCouponsTable";
import { SmsCampaignTable } from "@/components/analytics/tables/SmsCampaignTable";
import { useMarketingTab } from "@/hooks/analytics/useMarketingTab";
import type { AnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";
import type { KpiItem } from "@/components/analytics/business/types";

interface MarketingTabProps {
  dateRange: AnalyticsDateRange;
  isActive: boolean;
}

export function MarketingTab({ dateRange, isActive }: MarketingTabProps) {
  const data = useMarketingTab(dateRange, isActive);

  const kpis: KpiItem[] = [
    {
      title: "Купон хэрэглээ",
      value: (data.couponData?.total_usages ?? 0).toLocaleString(),
      icon: Ticket,
      iconColor: "bg-orange-100 text-orange-800",
    },
    {
      title: "SMS илгээсэн",
      value: data.smsSent.toLocaleString(),
      icon: MessageSquare,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "SMS үлдэгдэл",
      value: data.smsBalance.toLocaleString(),
      icon: Wallet,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Нийт хөнгөлөлт",
      value: `₮${Number(data.couponData?.total_discount ?? 0).toLocaleString()}`,
      icon: BadgePercent,
      iconColor: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      <TabKpiGrid items={kpis} isLoading={data.isLoading} />

      <CouponUsageTrend
        data={data.couponData?.usage_by_day ?? []}
        isLoading={data.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopCouponsTable
          data={data.couponData?.top_coupons ?? []}
          isLoading={data.isLoading}
        />
        <SmsCampaignTable data={data.smsCampaigns} isLoading={data.smsLoading} />
      </div>
    </div>
  );
}
