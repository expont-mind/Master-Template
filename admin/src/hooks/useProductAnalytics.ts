"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { aggregateByDay } from "@/hooks/useAnalyticsData";
import { parseMonthRange, getCurrentMonth } from "@/lib/utils/date-range";
import type {
  OrderRow,
  OrderItemRow,
  InventoryRow,
  ReviewRow,
  ProductAnalyticsData,
  ProductOrderRow,
} from "@/components/analytics/business/types";

// ── Helpers ───────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

interface ProductInfo {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  status: string;
  product_images: { url: string; is_primary: boolean }[];
}

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// ── Hook ──────────────────────────────────────────────────────

export function useProductAnalytics(productId: string) {
  const [initialMonth] = useState(() => getCurrentMonth());
  const [period, setPeriodRaw] = useState<string>(initialMonth);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    () => parseMonthRange(initialMonth)!,
  );

  const setPeriod = useCallback((value: string) => {
    setPeriodRaw(value);
    if (value === "all") {
      setDateRange({ from: new Date("2020-01-01T00:00:00Z"), to: new Date() });
      return;
    }
    const monthRange = parseMonthRange(value);
    if (monthRange) {
      setDateRange(monthRange);
    }
  }, []);

  const setCustomDateRange = useCallback((range: { from: Date; to: Date }) => {
    setPeriodRaw("custom");
    setDateRange(range);
  }, []);

  const { from, to } = dateRange;
  const periodDays = daysBetween(from, to);
  const prevFrom = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() - periodDays);
    return d;
  }, [from, periodDays]);

  const fromIso = useMemo(() => from.toISOString(), [from]);
  const toIso = useMemo(() => to.toISOString(), [to]);

  // Product info
  const productQuery = useQuery({
    queryKey: [...queryKeys.analytics.product(productId, fromIso, toIso), "info"],
    queryFn: () =>
      adminApi.getById<ProductInfo>("products", productId, {
        select: "id,name,price,discount_price,status,product_images(url,is_primary)",
      }),
    ...QUERY_CONFIG,
  });

  // Order items for this product (with order details). Switched to
  // getAllBatched because the API route now caps per-call limit at 500.
  const orderItemsQuery = useQuery({
    queryKey: [...queryKeys.analytics.product(productId, fromIso, toIso), "order_items"],
    queryFn: () =>
      adminApi.getAllBatched<OrderItemRow & { orders: OrderRow | null }>("order_items", {
        select:
          "id,order_id,product_id,quantity,price,orders(id,total_amount,status,delivery_status,payment_status,created_at)",
        filters: { "product_id.eq": productId },
      }),
    ...QUERY_CONFIG,
  });

  // Reviews for this product
  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.analytics.product(productId, fromIso, toIso), "reviews"],
    queryFn: () =>
      adminApi.getAllBatched<ReviewRow & { rating: number; created_at: string; comment?: string }>(
        "reviews",
        {
          select: "product_id,rating,status,created_at,comment",
          filters: { "product_id.eq": productId, "status.eq": "active" },
          },
      ),
    ...QUERY_CONFIG,
  });

  // Inventory
  const inventoryQuery = useQuery({
    queryKey: [...queryKeys.analytics.product(productId, fromIso, toIso), "inventory"],
    queryFn: () =>
      adminApi.getAllBatched<InventoryRow>("inventory", {
        select: "product_id,stock_quantity,reserved_quantity",
        filters: { "product_id.eq": productId },
      }),
    ...QUERY_CONFIG,
  });

  const isLoading =
    productQuery.isLoading ||
    orderItemsQuery.isLoading ||
    reviewsQuery.isLoading ||
    inventoryQuery.isLoading;

  const data = useMemo<ProductAnalyticsData | null>(() => {
    const productInfo = productQuery.data;
    if (!productInfo) return null;

    const allItems = orderItemsQuery.data ?? [];
    const allReviews = reviewsQuery.data ?? [];
    const inventory = inventoryQuery.data ?? [];

    const primaryImage = productInfo.product_images?.find((img) => img.is_primary);
    const imageUrl = primaryImage?.url ?? productInfo.product_images?.[0]?.url ?? null;

    // Filter order items by date range — only paid, non-canceled orders
    const periodItems = allItems.filter((item) => {
      const order = (item as unknown as { orders: OrderRow | null }).orders;
      if (!order) return false;
      const d = new Date(order.created_at);
      return (
        d >= from &&
        d < to &&
        order.status !== "canceled" &&
        order.payment_status === "paid"
      );
    });

    const prevItems = allItems.filter((item) => {
      const order = (item as unknown as { orders: OrderRow | null }).orders;
      if (!order) return false;
      const d = new Date(order.created_at);
      return (
        d >= prevFrom &&
        d < from &&
        order.status !== "canceled" &&
        order.payment_status === "paid"
      );
    });

    const totalQtySold = periodItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalRevenue = periodItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const prevQtySold = prevItems.reduce((sum, i) => sum + i.quantity, 0);
    const prevRevenue = prevItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const avgUnitPrice = totalQtySold > 0 ? totalRevenue / totalQtySold : 0;

    // Reviews
    const reviewCount = allReviews.length;
    const avgRating =
      reviewCount > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;

    // Sales by day (revenue)
    const salesByDay = aggregateByDay(
      periodItems.map((item) => {
        const order = (item as unknown as { orders: OrderRow }).orders;
        return { created_at: order.created_at, value: item.quantity * item.price };
      }),
      periodDays,
    );

    // Qty by day
    const qtyByDay = aggregateByDay(
      periodItems.map((item) => {
        const order = (item as unknown as { orders: OrderRow }).orders;
        return { created_at: order.created_at, value: item.quantity };
      }),
      periodDays,
    );

    // Recent orders (paid, non-canceled only)
    const periodAllItems = allItems.filter((item) => {
      const order = (item as unknown as { orders: OrderRow | null }).orders;
      if (!order) return false;
      const d = new Date(order.created_at);
      return d >= from && d < to && order.status !== "canceled" && order.payment_status === "paid";
    });

    const recentOrders: ProductOrderRow[] = periodAllItems
      .map((item) => {
        const order = (item as unknown as { orders: OrderRow }).orders;
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

    // Inventory
    const inv = inventory[0];
    const stock = inv?.stock_quantity ?? 0;
    const reserved = inv?.reserved_quantity ?? 0;

    return {
      product: {
        id: productInfo.id,
        name: productInfo.name,
        price: productInfo.price,
        discountPrice: productInfo.discount_price,
        status: productInfo.status,
        imageUrl,
      },
      totalQtySold,
      totalRevenue,
      prevQtySold,
      prevRevenue,
      avgUnitPrice,
      avgRating,
      reviewCount,
      salesByDay,
      qtyByDay,
      recentOrders,
      stock,
      reserved,
    };
  }, [
    productQuery.data,
    orderItemsQuery.data,
    reviewsQuery.data,
    inventoryQuery.data,
    from,
    to,
    prevFrom,
    periodDays,
  ]);

  return {
    data,
    isLoading,
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
  };
}
