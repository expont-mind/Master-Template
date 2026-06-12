// Pure aggregator helpers for useProductAnalytics. Extracted to keep the
// useMemo body small and reduce its complexity score.

import { aggregateByDay } from "@/hooks/useAnalyticsData";

import type {
  OrderRow,
  OrderItemRow,
  ProductOrderRow,
} from "@/components/analytics/business/types";

type ItemWithOrder = OrderItemRow & { orders: OrderRow | null };

function getOrder(item: ItemWithOrder): OrderRow | null {
  return item.orders;
}

function isPaidNonCanceled(order: OrderRow): boolean {
  return order.status !== "canceled" && order.payment_status === "paid";
}

export function filterItemsByPeriod(items: ItemWithOrder[], from: Date, to: Date): ItemWithOrder[] {
  return items.filter((item) => {
    const order = getOrder(item);
    if (!order) return false;
    const d = new Date(order.created_at);
    return d >= from && d < to && isPaidNonCanceled(order);
  });
}

export interface PeriodTotals {
  totalQtySold: number;
  totalRevenue: number;
  avgUnitPrice: number;
}

export function computePeriodTotals(items: ItemWithOrder[]): PeriodTotals {
  const totalQtySold = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalRevenue = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const avgUnitPrice = totalQtySold > 0 ? totalRevenue / totalQtySold : 0;
  return { totalQtySold, totalRevenue, avgUnitPrice };
}

export function buildSalesByDay(items: ItemWithOrder[], periodDays: number) {
  return aggregateByDay(
    items.map((item) => {
      const order = item.orders!;
      return {
        created_at: order.created_at,
        value: item.quantity * item.price,
      };
    }),
    periodDays,
  );
}

export function buildQtyByDay(items: ItemWithOrder[], periodDays: number) {
  return aggregateByDay(
    items.map((item) => {
      const order = item.orders!;
      return { created_at: order.created_at, value: item.quantity };
    }),
    periodDays,
  );
}

export function buildRecentOrders(items: ItemWithOrder[]): ProductOrderRow[] {
  return items
    .map((item) => {
      const order = item.orders!;
      return {
        itemId: (item as unknown as { id: string }).id,
        orderId: order.id,
        date: order.created_at,
        qty: item.quantity,
        unitPrice: item.price,
        total: item.quantity * item.price,
        paymentStatus: order.payment_status,
        deliveryStatus: order.delivery_status,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);
}
