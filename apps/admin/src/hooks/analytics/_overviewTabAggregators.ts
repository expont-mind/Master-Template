// Pure aggregator helpers for useOverviewTab. Extracted to keep the hook's
// useMemo body small and within the complexity budget. No React, no IO.

import { aggregateByDay } from "@/hooks/useAnalyticsData";
import { parseAsUTC } from "@/lib/utils/formatters";

import type {
  OrderRow,
  UserRow,
  OrderItemRow,
  DayValue,
} from "@/components/analytics/business/types";

interface OrderPartition {
  periodOrders: OrderRow[];
  prevPeriodOrders: OrderRow[];
  revenueOrders: OrderRow[];
  prevRevenueOrders: OrderRow[];
}

export function partitionOverviewOrders(
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

export interface OverviewOrderMetrics {
  totalRevenue: number;
  prevRevenue: number;
  totalOrders: number;
  prevOrders: number;
  averageOrderValue: number;
}

export function computeOverviewOrderMetrics(p: OrderPartition): OverviewOrderMetrics {
  const totalRevenue = p.revenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const prevRevenue = p.prevRevenueOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalOrders = p.periodOrders.length;
  const prevOrders = p.prevPeriodOrders.length;
  const averageOrderValue = p.revenueOrders.length > 0 ? totalRevenue / p.revenueOrders.length : 0;
  return {
    totalRevenue,
    prevRevenue,
    totalOrders,
    prevOrders,
    averageOrderValue,
  };
}

interface UserPartition {
  periodUsers: UserRow[];
  prevPeriodUsers: UserRow[];
}

export function partitionOverviewUsers(
  allUsers: UserRow[],
  from: Date,
  isAllTime: boolean,
): UserPartition {
  const periodUsers = isAllTime ? allUsers : allUsers.filter((u) => new Date(u.created_at) >= from);
  const prevPeriodUsers = isAllTime ? [] : allUsers.filter((u) => new Date(u.created_at) < from);
  return { periodUsers, prevPeriodUsers };
}

export interface OverviewDayBuckets {
  revenueByDay: DayValue[];
  ordersByDay: DayValue[];
  usersByDay: DayValue[];
}

export function buildOverviewDayBuckets(
  revenueOrders: OrderRow[],
  periodOrders: OrderRow[],
  periodUsers: UserRow[],
  periodDays: number,
): OverviewDayBuckets {
  const revenueByDay = aggregateByDay(
    revenueOrders.map((o) => ({
      created_at: o.created_at,
      value: o.total_amount || 0,
    })),
    periodDays,
  );
  const ordersByDay = aggregateByDay(
    periodOrders.map((o) => ({ created_at: o.created_at, value: 1 })),
    periodDays,
  );
  const usersByDay = aggregateByDay(
    periodUsers.map((u) => ({ created_at: u.created_at, value: 1 })),
    periodDays,
  );
  return { revenueByDay, ordersByDay, usersByDay };
}

export function buildTopProducts(
  allOrderItems: OrderItemRow[],
  revenueOrders: OrderRow[],
): { name: string; revenue: number }[] {
  const paidOrderIds = new Set(revenueOrders.map((o) => o.id));
  const productRevMap = new Map<string, { name: string; revenue: number }>();
  for (const item of allOrderItems) {
    if (!paidOrderIds.has(item.order_id) || !item.products) continue;
    const existing = productRevMap.get(item.product_id);
    const rev = item.quantity * item.price;
    if (existing) {
      existing.revenue += rev;
    } else {
      productRevMap.set(item.product_id, {
        name: item.products.name,
        revenue: rev,
      });
    }
  }
  return Array.from(productRevMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
