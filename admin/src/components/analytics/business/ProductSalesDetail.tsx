"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Hash,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/constants";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
} from "@/constants";
import {
  CHART_TOOLTIP_STYLE,
  CHART_AXIS_STYLE,
} from "./types";
import { getMonthOptions } from "@/lib/utils/date-range";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSalesDetailProps {
  productId: string;
}

// ── KPI Card ──────────────────────────────────────────────────

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return ((current - previous) / previous) * 100;
}

function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  iconColor: string;
}) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change >= 0;

  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn("rounded-md p-1.5", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hasChange && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">өмнөх үеэс</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────

export function ProductSalesDetail({ productId }: ProductSalesDetailProps) {
  const {
    data,
    isLoading,
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
  } = useProductAnalytics(productId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!data) {
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

  const { product } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Буцах
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className={
                    PRODUCT_STATUS_COLORS[
                      product.status as keyof typeof PRODUCT_STATUS_COLORS
                    ] ?? ""
                  }
                >
                  {PRODUCT_STATUS_LABELS[
                    product.status as keyof typeof PRODUCT_STATUS_LABELS
                  ] ?? product.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ₮{product.price.toLocaleString()}
                  {product.discountPrice && (
                    <span className="ml-1 text-red-600">
                      → ₮{product.discountPrice.toLocaleString()}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх хугацаа</SelectItem>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Сараар</SelectLabel>
                {getMonthOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectItem value="custom">Өөр хугацаа</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={(range) => {
                if (range.from && range.to) {
                  setCustomDateRange({ from: range.from, to: range.to });
                }
              }}
              className="w-[280px]"
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
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
          value={
            data.avgRating !== null
              ? `${data.avgRating.toFixed(1)} / 5`
              : "—"
          }
          icon={Star}
          iconColor="bg-yellow-100 text-yellow-800"
        />
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Орлогын чиг хандлага</CardTitle>
        </CardHeader>
        <CardContent>
          {data.salesByDay.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Мэдээлэл байхгүй байна
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.salesByDay}>
                <defs>
                  <linearGradient id="prodRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
                <YAxis
                  {...CHART_AXIS_STYLE}
                  tickFormatter={(v: number) => `₮${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  {...CHART_TOOLTIP_STYLE}
                  formatter={(value: number | undefined) => [
                    `₮${(value ?? 0).toLocaleString()}`,
                    "Орлого",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  fill="url(#prodRevenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Qty Sold Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Зарагдсан тоо хэмжээ</CardTitle>
        </CardHeader>
        <CardContent>
          {data.qtyByDay.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Мэдээлэл байхгүй байна
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.qtyByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" {...CHART_AXIS_STYLE} />
                <YAxis {...CHART_AXIS_STYLE} />
                <Tooltip
                  {...CHART_TOOLTIP_STYLE}
                  formatter={(value: number | undefined) => [value ?? 0, "Тоо ширхэг"]}
                />
                <Bar
                  dataKey="value"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Inventory */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Нөөцийн үлдэгдэл</p>
            <p className="mt-2 text-2xl font-bold">{data.stock}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Захиалгад резервлэгдсэн</p>
            <p className="mt-2 text-2xl font-bold">{data.reserved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Сүүлийн захиалгууд</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Захиалга байхгүй байна
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Захиалга</th>
                    <th className="pb-3 pr-4 font-medium">Огноо</th>
                    <th className="pb-3 pr-4 font-medium text-right">Тоо</th>
                    <th className="pb-3 pr-4 font-medium text-right">Нэгж үнэ</th>
                    <th className="pb-3 pr-4 font-medium text-right">Нийт</th>
                    <th className="pb-3 pr-4 font-medium">Төлбөр</th>
                    <th className="pb-3 font-medium">Хүргэлт</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.itemId} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/orders/${order.orderId}`}
                          className="hover:underline font-medium text-xs"
                        >
                          {order.orderId.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {format(new Date(order.date), "yyyy.MM.dd HH:mm", {
                          locale: mn,
                        })}
                      </td>
                      <td className="py-3 pr-4 text-right">{order.qty}</td>
                      <td className="py-3 pr-4 text-right">
                        ₮{order.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        ₮{order.total.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            PAYMENT_STATUS_COLORS[
                              order.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS
                            ] ?? ""
                          }
                        >
                          {PAYMENT_STATUS_LABELS[
                            order.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS
                          ] ?? order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="secondary"
                          className={
                            DELIVERY_STATUS_COLORS[
                              order.deliveryStatus as keyof typeof DELIVERY_STATUS_COLORS
                            ] ?? ""
                          }
                        >
                          {DELIVERY_STATUS_LABELS[
                            order.deliveryStatus as keyof typeof DELIVERY_STATUS_LABELS
                          ] ?? order.deliveryStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Үнэлгээний хураангуй
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.reviewCount === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              Үнэлгээ байхгүй байна
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold">
                  {data.avgRating?.toFixed(1) ?? "—"}
                </p>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(data.avgRating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.reviewCount} үнэлгээ
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  // We don't have per-star counts from the hook, so show a simple bar based on avg
                  const pct =
                    data.avgRating !== null
                      ? Math.max(
                          0,
                          Math.min(100, (1 - Math.abs(star - data.avgRating) / 4) * 100),
                        )
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
