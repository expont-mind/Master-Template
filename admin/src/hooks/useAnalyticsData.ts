"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { parseMonthRange, getCurrentMonth } from "@/lib/utils/date-range";
import { parseAsUTC } from "@/lib/utils/formatters";
import type {
  OrderRow,
  UserRow,
  OrderItemRow,
  ProductRow,
  ReviewRow,
  CategoryRow,
  AnalyticsData,
  DayValue,
  ProductPerformance,
  InventoryAlert,
} from "@/components/analytics/business/types";

// ── Helpers ───────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

function toWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  // Start of week (Monday)
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

/** Compute number of days between two dates */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function aggregateByDay(
  items: { created_at: string; value: number }[],
  periodDays: number,
): DayValue[] {
  const useWeekly = periodDays >= 90;
  const map = new Map<string, { sortKey: string; value: number }>();

  for (const item of items) {
    const key = useWeekly ? toWeekKey(item.created_at) : toDateKey(item.created_at);
    // Keep ISO date for sorting
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

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// ── Hook ──────────────────────────────────────────────────────

export function useAnalyticsData() {
  const [initialMonth] = useState(() => getCurrentMonth());
  const [period, setPeriodRaw] = useState<string>(initialMonth);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    () => parseMonthRange(initialMonth)!,
  );

  // When a preset is selected, update the date range automatically
  const setPeriod = useCallback((value: string) => {
    setPeriodRaw(value);
    if (value === "all") {
      setDateRange({ from: new Date("2020-01-01T00:00:00Z"), to: new Date() });
      return;
    }
    // Month format: "YYYY-MM"
    const monthRange = parseMonthRange(value);
    if (monthRange) {
      setDateRange(monthRange);
    }
  }, []);

  // When a custom date range is picked, clear the preset
  const setCustomDateRange = useCallback((range: { from: Date; to: Date }) => {
    setPeriodRaw("custom");
    setDateRange(range);
  }, []);

  const { from, to } = dateRange;
  const periodDays = daysBetween(from, to);

  // Previous period of same length for comparison
  const prevFrom = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() - periodDays);
    return d;
  }, [from, periodDays]);

  const isAllTime = period === "all";
  const prevFromIso = useMemo(() => prevFrom.toISOString(), [prevFrom]);
  const fromIso = useMemo(() => from.toISOString(), [from]);
  const toIso = useMemo(() => to.toISOString(), [to]);

  const dateFilters = useMemo(
    () => isAllTime ? undefined : { "created_at.gte": prevFromIso, "created_at.lt": toIso },
    [isAllTime, prevFromIso, toIso],
  );

  // Query 1: Orders — getAllBatched paginates in 500-row batches to bypass PostgREST max_rows
  const ordersQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "orders", prevFromIso, isAllTime],
    queryFn: () =>
      adminApi.getAllBatched<OrderRow>("orders", {
        select:
          "id,total_amount,status,delivery_status,payment_status,payment_method,created_at",
        filters: dateFilters,
      }),
    ...QUERY_CONFIG,
  });

  // Query 2: Users
  const usersQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "users", prevFromIso, isAllTime],
    queryFn: () =>
      adminApi.getAllBatchedWithMeta<UserRow>("users", {
        select: "id,status,created_at",
        filters: dateFilters,
      }),
    ...QUERY_CONFIG,
  });

  // Query 3: Order items with products. Switched from getAll(limit:10000)
  // to getAllBatched with a hard cap because the API route now enforces
  // a 500-row per-request limit and the previous call would have been
  // silently truncated.
  const orderItemsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "order_items"],
    queryFn: () =>
      adminApi.getAllBatched<OrderItemRow>("order_items", {
        select:
          "order_id,product_id,quantity,price,products(id,name,price,category_id,brand_id,status,product_images(url,is_primary))",
      }),
    ...QUERY_CONFIG,
  });

  // Query 4: Products + Inventory
  const productsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "products"],
    queryFn: () =>
      adminApi.getAllBatched<ProductRow>("products", {
        select: "id,name,price,discount_price,stock_quantity,status,category_id,brand_id,created_at,product_variants(id,stock_quantity)",
      }),
    ...QUERY_CONFIG,
  });

  // Query 5: Reviews
  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "reviews"],
    queryFn: () =>
      adminApi.getAllBatched<ReviewRow>("reviews", {
        select: "product_id,rating,status",
        filters: { "status.eq": "active" },
      }),
    ...QUERY_CONFIG,
  });

  // Query 6: Categories
  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.analytics.dashboard(fromIso, toIso), "categories"],
    queryFn: () =>
      adminApi.getAllBatched<CategoryRow>("categories", {
        select: "id,name",
      }),
    ...QUERY_CONFIG,
  });

  const isLoading =
    ordersQuery.isLoading ||
    usersQuery.isLoading ||
    orderItemsQuery.isLoading ||
    productsQuery.isLoading ||
    reviewsQuery.isLoading ||
    categoriesQuery.isLoading;

  const data = useMemo<AnalyticsData>(() => {
    const allOrders = ordersQuery.data ?? [];
    const usersResult = usersQuery.data;
    const allUsers = usersResult?.data ?? [];
    const allOrderItems = orderItemsQuery.data ?? [];
    const allProducts = productsQuery.data ?? [];
    const allReviews = reviewsQuery.data ?? [];
    const allCategories = categoriesQuery.data ?? [];

    // ── Split server-filtered orders into current / prev period ──
    const periodOrders = isAllTime
      ? allOrders
      : allOrders.filter((o) => parseAsUTC(o.created_at) >= from);
    const prevPeriodOrders = isAllTime
      ? []
      : allOrders.filter((o) => parseAsUTC(o.created_at) < from);

    // Only count actually paid orders for revenue
    const revenueOrders = periodOrders.filter(
      (o) => o.status !== "canceled" && o.payment_status === "paid",
    );
    const prevRevenueOrders = prevPeriodOrders.filter(
      (o) => o.status !== "canceled" && o.payment_status === "paid",
    );

    const totalRevenue = revenueOrders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0,
    );
    const prevRevenue = prevRevenueOrders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0,
    );

    const totalOrders = periodOrders.length;
    const prevOrders = prevPeriodOrders.length;

    const canceledOrders = periodOrders.filter(
      (o) => o.status === "canceled",
    ).length;
    const cancellationRate =
      totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;

    const averageOrderValue =
      revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    // Revenue by day
    const revenueByDay = aggregateByDay(
      revenueOrders.map((o) => ({
        created_at: o.created_at,
        value: o.total_amount || 0,
      })),
      periodDays,
    );

    // Orders by day
    const ordersByDay = aggregateByDay(
      periodOrders.map((o) => ({ created_at: o.created_at, value: 1 })),
      periodDays,
    );

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const o of periodOrders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    // Delivery funnel
    const deliveryFunnel: Record<string, number> = {};
    for (const o of periodOrders) {
      if (o.delivery_status) {
        deliveryFunnel[o.delivery_status] =
          (deliveryFunnel[o.delivery_status] ?? 0) + 1;
      }
    }

    // Payment method breakdown (only non-canceled orders)
    const nonCanceledOrders = periodOrders.filter((o) => o.status !== "canceled");
    const paymentMethodBreakdown: Record<string, number> = {};
    for (const o of nonCanceledOrders) {
      if (o.payment_method) {
        paymentMethodBreakdown[o.payment_method] =
          (paymentMethodBreakdown[o.payment_method] ?? 0) + 1;
      }
    }

    // ── Users ──────────────────────────────────────────────
    const periodUsers = isAllTime
      ? allUsers
      : allUsers.filter((u) => new Date(u.created_at) >= from);
    const prevPeriodUsers = isAllTime
      ? []
      : allUsers.filter((u) => new Date(u.created_at) < from);

    const newUsers = periodUsers.length;
    const prevNewUsers = prevPeriodUsers.length;
    const totalUsers = usersResult?.totalCount ?? allUsers.length;
    const activeUsers = allUsers.filter((u) => u.status === "active").length;

    const usersByDay = aggregateByDay(
      periodUsers.map((u) => ({ created_at: u.created_at, value: 1 })),
      periodDays,
    );

    // ── Products + order items ─────────────────────────────
    // Only count items from paid, non-canceled orders
    const paidOrderIds = new Set(revenueOrders.map((o) => o.id));

    // Per-product aggregation from order items
    const productSalesMap = new Map<
      string,
      { qty: number; revenue: number; imageUrl: string | null }
    >();

    for (const item of allOrderItems) {
      if (!paidOrderIds.has(item.order_id)) continue;
      const existing = productSalesMap.get(item.product_id);
      const primaryImage = item.products?.product_images?.find(
        (img) => img.is_primary,
      );
      const imageUrl =
        primaryImage?.url ?? item.products?.product_images?.[0]?.url ?? null;

      if (existing) {
        existing.qty += item.quantity;
        existing.revenue += item.quantity * item.price;
        if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;
      } else {
        productSalesMap.set(item.product_id, {
          qty: item.quantity,
          revenue: item.quantity * item.price,
          imageUrl,
        });
      }
    }

    // Reviews per product
    const reviewMap = new Map<
      string,
      { total: number; sum: number }
    >();
    let allRatingSum = 0;
    let allRatingCount = 0;

    for (const r of allReviews) {
      allRatingSum += r.rating;
      allRatingCount++;
      const existing = reviewMap.get(r.product_id);
      if (existing) {
        existing.total++;
        existing.sum += r.rating;
      } else {
        reviewMap.set(r.product_id, { total: 1, sum: r.rating });
      }
    }

    const avgRating = allRatingCount > 0 ? allRatingSum / allRatingCount : 0;

    // Category map
    const categoryMap = new Map<string, string>();
    for (const c of allCategories) {
      categoryMap.set(c.id, c.name);
    }

    // Build full product performance list
    const allProductPerf: ProductPerformance[] = allProducts.map((p) => {
      const sales = productSalesMap.get(p.id);
      const review = reviewMap.get(p.id);
      const variantStock = p.product_variants?.length
        ? p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
        : null;
      const totalStock = variantStock ?? (p.stock_quantity || 0);

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        discountPrice: p.discount_price,
        status: p.status,
        categoryId: p.category_id,
        imageUrl: sales?.imageUrl ?? null,
        qtySold: sales?.qty ?? 0,
        revenue: sales?.revenue ?? 0,
        stock: totalStock,
        reserved: 0,
        avgRating: review ? review.sum / review.total : null,
        reviewCount: review?.total ?? 0,
        variantCount: p.product_variants?.length ?? 0,
      };
    });

    // Category breakdown
    const categoryRevMap = new Map<string, number>();
    for (const p of allProductPerf) {
      if (p.categoryId && p.revenue > 0) {
        const name = categoryMap.get(p.categoryId) ?? "Бусад";
        categoryRevMap.set(name, (categoryRevMap.get(name) ?? 0) + p.revenue);
      }
    }
    const categoryBreakdown = Array.from(categoryRevMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Inventory alerts: stock <= 5
    const inventoryAlerts: InventoryAlert[] = allProducts
      .filter((p) => {
        const vs = p.product_variants?.length
          ? p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
          : null;
        const stock = vs ?? (p.stock_quantity || 0);
        return stock <= 5 && p.status === "active";
      })
      .map((p) => {
        const vs = p.product_variants?.length
          ? p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
          : null;
        const stock = vs ?? (p.stock_quantity || 0);
        const sales = productSalesMap.get(p.id);
        return {
          productId: p.id,
          name: p.name,
          imageUrl: sales?.imageUrl ?? null,
          stock,
          reserved: 0,
        };
      })
      .sort((a, b) => a.stock - b.stock);

    return {
      totalRevenue,
      prevRevenue,
      totalOrders,
      prevOrders,
      newUsers,
      prevNewUsers,
      averageOrderValue,
      cancellationRate,
      avgRating,
      revenueByDay,
      ordersByDay,
      ordersByStatus,
      deliveryFunnel,
      paymentMethodBreakdown,
      usersByDay,
      totalUsers,
      activeUsers,
      allProducts: allProductPerf,
      categoryBreakdown,
      inventoryAlerts,
      isLoading,
    };
  }, [
    ordersQuery.data,
    usersQuery.data,
    orderItemsQuery.data,
    productsQuery.data,
    reviewsQuery.data,
    categoriesQuery.data,
    from,
    to,
    prevFrom,
    periodDays,
    isAllTime,
  ]);

  return {
    ...data,
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
  };
}
