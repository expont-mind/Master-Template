"use client";

import { ArrowLeft, DollarSign, Hash, Package, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";

import { ProductRecentOrdersTable } from "./_ProductRecentOrdersTable";
import { ProductReviewSummary } from "./_ProductReviewSummary";
import { ProductQtyChart, ProductRevenueChart } from "./_ProductSalesCharts";
import { ProductSalesHeader } from "./_ProductSalesHeader";
import { KpiCard, pctChange } from "./_ProductSalesKpiCard";

interface ProductSalesDetailProps {
  productId: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {["k1", "k2", "k3", "k4"].map((id) => (
          <div key={id} className="h-[120px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded bg-muted" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6">
      <Link href="/analytics">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Аналитик руу буцах
        </Button>
      </Link>
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Бүтээгдэхүүн олдсонгүй
      </div>
    </div>
  );
}

function InventoryCards({ stock, reserved }: { stock: number; reserved: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="py-4">
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">Нөөцийн үлдэгдэл</p>
          <p className="mt-2 text-2xl font-bold">{stock}</p>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">Захиалгад резервлэгдсэн</p>
          <p className="mt-2 text-2xl font-bold">{reserved}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductSalesDetail({ productId }: ProductSalesDetailProps) {
  const { data, isLoading, period, setPeriod, dateRange, setCustomDateRange } =
    useProductAnalytics(productId);

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState />;

  const { product } = data;

  return (
    <div className="space-y-6">
      <ProductSalesHeader
        product={product}
        period={period}
        setPeriod={setPeriod}
        dateRange={dateRange}
        setCustomDateRange={setCustomDateRange}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Нийт зарагдсан"
          value={data.totalQtySold.toLocaleString()}
          change={pctChange(data.totalQtySold, data.prevQtySold)}
          icon={Hash}
          iconColor="bg-blue-100 text-blue-800"
        />
        <KpiCard
          title="Нийт орлого"
          value={`₮${data.totalRevenue.toLocaleString()}`}
          change={pctChange(data.totalRevenue, data.prevRevenue)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-800"
        />
        <KpiCard
          title="Дундаж нэгж үнэ"
          value={`₮${Math.round(data.avgUnitPrice).toLocaleString()}`}
          icon={Package}
          iconColor="bg-orange-100 text-orange-800"
        />
        <KpiCard
          title="Дундаж үнэлгээ"
          value={data.avgRating !== null ? `${data.avgRating.toFixed(1)} / 5` : "—"}
          icon={Star}
          iconColor="bg-yellow-100 text-yellow-800"
        />
      </div>

      <ProductRevenueChart data={data.salesByDay} />
      <ProductQtyChart data={data.qtyByDay} />

      <InventoryCards stock={data.stock} reserved={data.reserved} />

      <ProductRecentOrdersTable orders={data.recentOrders} />

      <ProductReviewSummary avgRating={data.avgRating} reviewCount={data.reviewCount} />
    </div>
  );
}
