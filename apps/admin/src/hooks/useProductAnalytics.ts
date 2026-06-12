"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { parseMonthRange, getCurrentMonth } from "@/lib/utils/date-range";

import {
  buildQtyByDay,
  buildRecentOrders,
  buildSalesByDay,
  computePeriodTotals,
  filterItemsByPeriod,
} from "./_productAnalyticsAggregators";

import type {
  OrderRow,
  OrderItemRow,
  InventoryRow,
  ReviewRow,
  ProductAnalyticsData,
} from "@/components/analytics/business/types";

// ── Helpers ───────────────────────────────────────────────────

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

function getPrimaryImageUrl(product: ProductInfo): string | null {
  const primary = product.product_images?.find((img) => img.is_primary);
  return primary?.url ?? product.product_images?.[0]?.url ?? null;
}

function computeAvgRating(reviews: ReviewRow[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

interface AssembleArgs {
  productInfo: ProductInfo | undefined;
  orderItems: OrderItemRow[] | undefined;
  reviews: ReviewRow[] | undefined;
  inventory: InventoryRow[] | undefined;
  from: Date;
  to: Date;
  prevFrom: Date;
  periodDays: number;
}

function assembleProductAnalytics({
  productInfo,
  orderItems,
  reviews,
  inventory,
  from,
  to,
  prevFrom,
  periodDays,
}: AssembleArgs): ProductAnalyticsData | null {
  if (!productInfo) return null;

  const allItems = (orderItems ?? []) as (OrderItemRow & { orders: OrderRow | null })[];
  const allReviews = reviews ?? [];
  const inv = (inventory ?? [])[0];

  const periodItems = filterItemsByPeriod(allItems, from, to);
  const prevItems = filterItemsByPeriod(allItems, prevFrom, from);
  const current = computePeriodTotals(periodItems);
  const prev = computePeriodTotals(prevItems);

  return {
    product: {
      id: productInfo.id,
      name: productInfo.name,
      price: productInfo.price,
      discountPrice: productInfo.discount_price,
      status: productInfo.status,
      imageUrl: getPrimaryImageUrl(productInfo),
    },
    totalQtySold: current.totalQtySold,
    totalRevenue: current.totalRevenue,
    prevQtySold: prev.totalQtySold,
    prevRevenue: prev.totalRevenue,
    avgUnitPrice: current.avgUnitPrice,
    avgRating: computeAvgRating(allReviews),
    reviewCount: allReviews.length,
    salesByDay: buildSalesByDay(periodItems, periodDays),
    qtyByDay: buildQtyByDay(periodItems, periodDays),
    recentOrders: buildRecentOrders(periodItems),
    stock: inv?.stock_quantity ?? 0,
    reserved: inv?.reserved_quantity ?? 0,
  };
}

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

  const data = useMemo<ProductAnalyticsData | null>(
    () =>
      assembleProductAnalytics({
        productInfo: productQuery.data,
        orderItems: orderItemsQuery.data,
        reviews: reviewsQuery.data,
        inventory: inventoryQuery.data,
        from,
        to,
        prevFrom,
        periodDays,
      }),
    [
      productQuery.data,
      orderItemsQuery.data,
      reviewsQuery.data,
      inventoryQuery.data,
      from,
      to,
      prevFrom,
      periodDays,
    ],
  );

  return {
    data,
    isLoading,
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
  };
}
