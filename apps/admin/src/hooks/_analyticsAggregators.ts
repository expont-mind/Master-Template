// Pure aggregator helpers for useAnalyticsData. Extracted to keep the hook's
// useMemo body small and testable. No React, no IO — just data shaping.
//
// Product / category / inventory aggregators are split into _productAggregators.ts
// (re-exported here for backwards-compatible imports).

import { parseAsUTC } from "@/lib/utils/formatters";

import type { DayValue, OrderRow, UserRow } from "@/components/analytics/business/types";

export {
  buildCategoryBreakdown,
  buildInventoryAlerts,
  buildProductPerformance,
  buildProductSalesMap,
  buildReviewStats,
  type ProductSales,
  type ReviewStats,
} from "./_productAggregators";

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

function toWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function aggregateByDay(
  items: { created_at: string; value: number }[],
  periodDays: number,
): DayValue[] {
  const useWeekly = periodDays >= 90;
  const map = new Map<string, { sortKey: string; value: number }>();

  for (const item of items) {
    const key = useWeekly ? toWeekKey(item.created_at) : toDateKey(item.created_at);
    const sortKey = item.created_at.slice(0, 10);
    const existing = map.get(key);
    if (existing) {
      existing.value += item.value;
      if (sortKey < existing.sortKey) existing.sortKey = sortKey;
    } else {
      map.set(key, { sortKey, value: item.value });
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([date, { value }]) => ({ date, value }));
}

interface OrderPartitioning {
  periodOrders: OrderRow[];
  prevPeriodOrders: OrderRow[];
  revenueOrders: OrderRow[];
  prevRevenueOrders: OrderRow[];
  paidOrderIds: Set<string>;
}

export function partitionOrders(
  allOrders: OrderRow[],
  from: Date,
  isAllTime: boolean,
): OrderPartitioning {
  const periodOrders = isAllTime
    ? allOrders
    : allOrders.filter((o) => parseAsUTC(o.created_at) >= from);
  const prevPeriodOrders = isAllTime
    ? []
    : allOrders.filter((o) => parseAsUTC(o.created_at) < from);

  const revenueOrders = periodOrders.filter(
    (o) => o.status !== "canceled" && o.payment_status === "paid",
  );
  const prevRevenueOrders = prevPeriodOrders.filter(
    (o) => o.status !== "canceled" && o.payment_status === "paid",
  );

  const paidOrderIds = new Set(revenueOrders.map((o) => o.id));
  return {
    periodOrders,
    prevPeriodOrders,
    revenueOrders,
    prevRevenueOrders,
    paidOrderIds,
  };
}

export interface OrderMetrics {
  totalRevenue: number;
  prevRevenue: number;
  totalOrders: number;
  prevOrders: number;
  averageOrderValue: number;
  cancellationRate: number;
}

export function computeOrderMetrics(p: OrderPartitioning): OrderMetrics {
  const totalRevenue = p.revenueOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const prevRevenue = p.prevRevenueOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = p.periodOrders.length;
  const prevOrders = p.prevPeriodOrders.length;
  const canceledOrders = p.periodOrders.filter((o) => o.status === "canceled").length;
  const cancellationRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;
  const averageOrderValue = p.revenueOrders.length > 0 ? totalRevenue / p.revenueOrders.length : 0;
  return {
    totalRevenue,
    prevRevenue,
    totalOrders,
    prevOrders,
    averageOrderValue,
    cancellationRate,
  };
}

export interface OrderBreakdown {
  ordersByStatus: Record<string, number>;
  deliveryFunnel: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
}

export function computeOrderBreakdown(periodOrders: OrderRow[]): OrderBreakdown {
  const ordersByStatus: Record<string, number> = {};
  const deliveryFunnel: Record<string, number> = {};
  for (const o of periodOrders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    if (o.delivery_status) {
      deliveryFunnel[o.delivery_status] = (deliveryFunnel[o.delivery_status] ?? 0) + 1;
    }
  }

  const paymentMethodBreakdown: Record<string, number> = {};
  for (const o of periodOrders) {
    if (o.status !== "canceled" && o.payment_method) {
      paymentMethodBreakdown[o.payment_method] =
        (paymentMethodBreakdown[o.payment_method] ?? 0) + 1;
    }
  }
  return { ordersByStatus, deliveryFunnel, paymentMethodBreakdown };
}

export interface UserMetrics {
  newUsers: number;
  prevNewUsers: number;
  totalUsers: number;
  activeUsers: number;
  periodUsers: UserRow[];
}

export function computeUserMetrics(
  allUsers: UserRow[],
  from: Date,
  isAllTime: boolean,
  totalCountFromMeta?: number | null,
): UserMetrics {
  const periodUsers = isAllTime ? allUsers : allUsers.filter((u) => new Date(u.created_at) >= from);
  const prevPeriodUsers = isAllTime ? [] : allUsers.filter((u) => new Date(u.created_at) < from);

  return {
    newUsers: periodUsers.length,
    prevNewUsers: prevPeriodUsers.length,
    totalUsers: totalCountFromMeta ?? allUsers.length,
    activeUsers: allUsers.filter((u) => u.status === "active").length,
    periodUsers,
  };
}
