"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnalyticsHeader } from "@/components/analytics/business/AnalyticsHeader";
import { useAnalyticsDateRange } from "@/hooks/analytics/useAnalyticsDateRange";
import { OverviewTab } from "@/components/analytics/tabs/OverviewTab";
import { SalesTab } from "@/components/analytics/tabs/SalesTab";
import { UsersTab } from "@/components/analytics/tabs/UsersTab";
import { ProductsTab } from "@/components/analytics/tabs/ProductsTab";
import { MarketingTab } from "@/components/analytics/tabs/MarketingTab";
import { InventoryTab } from "@/components/analytics/tabs/InventoryTab";

const TABS = [
  { value: "overview", label: "Ерөнхий" },
  { value: "sales", label: "Борлуулалт" },
  { value: "users", label: "Хэрэглэгч" },
  { value: "products", label: "Бүтээгдэхүүн" },
  { value: "marketing", label: "Маркетинг" },
  { value: "inventory", label: "Нөөц" },
] as const;

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "overview";
  const dateRange = useAnalyticsDateRange();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/analytics?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        period={dateRange.period}
        onPeriodChange={dateRange.setPeriod}
        dateRange={dateRange.dateRange}
        onDateRangeChange={dateRange.setCustomDateRange}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab dateRange={dateRange} isActive={activeTab === "overview"} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesTab dateRange={dateRange} isActive={activeTab === "sales"} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab dateRange={dateRange} isActive={activeTab === "users"} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab dateRange={dateRange} isActive={activeTab === "products"} />
        </TabsContent>
        <TabsContent value="marketing">
          <MarketingTab dateRange={dateRange} isActive={activeTab === "marketing"} />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryTab dateRange={dateRange} isActive={activeTab === "inventory"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsContent />
    </Suspense>
  );
}
