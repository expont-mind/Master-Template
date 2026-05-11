"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { ProductRow, CategoryRow, InventoryAlert } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

function getStock(p: ProductRow): number {
  if (p.product_variants?.length) {
    return p.product_variants.reduce((s, v) => s + v.stock_quantity, 0);
  }
  return p.stock_quantity || 0;
}

export function useInventoryTab(dr: AnalyticsDateRange, isActive: boolean) {
  const productsQuery = useQuery({
    queryKey: [...queryKeys.analytics.inventory(dr.fromIso, dr.toIso), "products"],
    queryFn: () =>
      adminApi.getAllBatched<ProductRow>("products", {
        select: "id,name,price,discount_price,stock_quantity,status,category_id,brand_id,created_at,product_variants(id,stock_quantity)",
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.analytics.inventory(dr.fromIso, dr.toIso), "categories"],
    queryFn: () => adminApi.getAllBatched<CategoryRow>("categories", { select: "id,name" }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading;

  const data = useMemo(() => {
    const allProducts = productsQuery.data ?? [];
    const allCategories = categoriesQuery.data ?? [];
    const activeProducts = allProducts.filter((p) => p.status === "active");

    // SKU count: products + variants
    let totalSkus = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalStockValue = 0;

    for (const p of activeProducts) {
      const stock = getStock(p);
      const variantCount = p.product_variants?.length ?? 0;
      totalSkus += variantCount > 0 ? variantCount : 1;
      if (stock === 0) outOfStock++;
      else if (stock <= 5) lowStock++;
      const price = p.discount_price ?? p.price;
      totalStockValue += stock * price;
    }

    // Stock distribution histogram
    const stockBuckets = [
      { label: "0 (Дууссан)", min: 0, max: 0, count: 0 },
      { label: "1-5", min: 1, max: 5, count: 0 },
      { label: "6-20", min: 6, max: 20, count: 0 },
      { label: "21-50", min: 21, max: 50, count: 0 },
      { label: "50+", min: 51, max: Infinity, count: 0 },
    ];
    for (const p of activeProducts) {
      const stock = getStock(p);
      for (const bucket of stockBuckets) {
        if (stock >= bucket.min && stock <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    // Inventory alerts: stock <= 5
    const inventoryAlerts: InventoryAlert[] = activeProducts
      .filter((p) => getStock(p) <= 5)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        imageUrl: null,
        stock: getStock(p),
        reserved: 0,
      }))
      .sort((a, b) => a.stock - b.stock);

    // Stock by category
    const categoryMap = new Map<string, string>();
    for (const c of allCategories) categoryMap.set(c.id, c.name);

    const categoryStockMap = new Map<string, number>();
    for (const p of activeProducts) {
      const catName = p.category_id ? (categoryMap.get(p.category_id) ?? "Бусад") : "Бусад";
      categoryStockMap.set(catName, (categoryStockMap.get(catName) ?? 0) + getStock(p));
    }
    const stockByCategory = Array.from(categoryStockMap.entries())
      .map(([name, stock]) => ({ name, stock }))
      .sort((a, b) => b.stock - a.stock);

    return {
      totalSkus,
      outOfStock,
      lowStock,
      totalStockValue,
      stockBuckets,
      inventoryAlerts,
      stockByCategory,
    };
  }, [productsQuery.data, categoriesQuery.data]);

  return { ...data, isLoading };
}
