// Pure aggregator helpers for useSalesTab. Extracted to keep the hook's
// useMemo body small and testable. No React, no IO — just data shaping.

import { aggregateByDay } from "@/hooks/useAnalyticsData";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { OrderRow, CategoryRow, DayValue } from "@/components/analytics/business/types";

type OrderItemSlim = {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: { category_id: string | null } | null;
};

export interface OrderPartition {
  periodOrders: OrderRow[];
  prevPeriodOrders: OrderRow[];
  revenueOrders: OrderRow[];
  prevRevenueOrders: OrderRow[];
}

export function partitionSalesOrders(
  allOrders: OrderRow[],
  from: Date,
  isAllTime: boolean,
): OrderPartition {
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

  return { periodOrders, prevPeriodOrders, revenueOrders, prevRevenueOrders };
}

export interface SalesMetrics {
  totalRevenue: number;
  prevRevenue: number;
  paidOrders: number;
  prevPaidOrders: number;
  totalOrders: number;
  cancellationRate: number;
  averageOrderValue: number;
  prevAov: number;
}

export function computeSalesMetrics(p: OrderPartition): SalesMetrics {
  const totalRevenue = p.revenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const prevRevenue = p.prevRevenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const paidOrders = p.revenueOrders.length;
  const prevPaidOrders = p.prevRevenueOrders.length;
  const totalOrders = p.periodOrders.length;
  const canceledOrders = p.periodOrders.filter((o) => o.status === "canceled").length;
  const cancellationRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;
  const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const prevAov = prevPaidOrders > 0 ? prevRevenue / prevPaidOrders : 0;

  return {
    totalRevenue,
    prevRevenue,
    paidOrders,
    prevPaidOrders,
    totalOrders,
    cancellationRate,
    averageOrderValue,
    prevAov,
  };
}

export function buildRevenueByDay(revenueOrders: OrderRow[], periodDays: number): DayValue[] {
  return aggregateByDay(
    revenueOrders.map((o) => ({
      created_at: o.created_at,
      value: o.total_amount || 0,
    })),
    periodDays,
  );
}

export interface OrderBreakdowns {
  ordersByStatus: Record<string, number>;
  deliveryFunnel: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
}

export function computeOrderBreakdowns(periodOrders: OrderRow[]): OrderBreakdowns {
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
    if (o.status === "canceled" || !o.payment_method) continue;
    paymentMethodBreakdown[o.payment_method] = (paymentMethodBreakdown[o.payment_method] ?? 0) + 1;
  }
  return { ordersByStatus, deliveryFunnel, paymentMethodBreakdown };
}

export function buildCategoryBreakdown(
  allOrderItems: OrderItemSlim[],
  allCategories: CategoryRow[],
  revenueOrderIds: Set<string>,
): { name: string; revenue: number }[] {
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
  const categoryRevMap = new Map<string, number>();
  for (const item of allOrderItems) {
    if (!revenueOrderIds.has(item.order_id)) continue;
    if (!item.products?.category_id) continue;
    const catName = categoryMap.get(item.products.category_id) ?? "Бусад";
    const rev = item.quantity * item.price;
    categoryRevMap.set(catName, (categoryRevMap.get(catName) ?? 0) + rev);
  }
  return Array.from(categoryRevMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}
