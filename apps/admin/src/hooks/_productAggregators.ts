// Product / category / inventory aggregators, extracted from
// _analyticsAggregators.ts to keep that file under the lint max-lines cap.
// Pure functions — no React, no IO.

import type {
  CategoryRow,
  InventoryAlert,
  OrderItemRow,
  ProductPerformance,
  ProductRow,
  ReviewRow,
} from "@/components/analytics/business/types";

export interface ProductSales {
  qty: number;
  revenue: number;
  imageUrl: string | null;
}

export interface ReviewStats {
  reviewMap: Map<string, { total: number; sum: number }>;
  avgRating: number;
}

function resolveOrderItemImageUrl(item: OrderItemRow): string | null {
  const images = item.products?.product_images ?? [];
  const primary = images.find((img) => img.is_primary);
  return primary?.url ?? images[0]?.url ?? null;
}

function mergeProductSales(
  existing: ProductSales,
  item: OrderItemRow,
  imageUrl: string | null,
): void {
  existing.qty += item.quantity;
  existing.revenue += item.quantity * item.price;
  if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;
}

export function buildProductSalesMap(
  allOrderItems: OrderItemRow[],
  paidOrderIds: Set<string>,
): Map<string, ProductSales> {
  const salesMap = new Map<string, ProductSales>();
  for (const item of allOrderItems) {
    if (!paidOrderIds.has(item.order_id)) continue;
    const imageUrl = resolveOrderItemImageUrl(item);
    const existing = salesMap.get(item.product_id);
    if (existing) {
      mergeProductSales(existing, item, imageUrl);
    } else {
      salesMap.set(item.product_id, {
        qty: item.quantity,
        revenue: item.quantity * item.price,
        imageUrl,
      });
    }
  }
  return salesMap;
}

export function buildReviewStats(allReviews: ReviewRow[]): ReviewStats {
  const reviewMap = new Map<string, { total: number; sum: number }>();
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

  return {
    reviewMap,
    avgRating: allRatingCount > 0 ? allRatingSum / allRatingCount : 0,
  };
}

function resolveStockTotal(p: ProductRow): number {
  const variantStock = p.product_variants?.length
    ? p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
    : null;
  return variantStock ?? (p.stock_quantity || 0);
}

export function buildProductPerformance(
  allProducts: ProductRow[],
  productSalesMap: Map<string, ProductSales>,
  reviewMap: Map<string, { total: number; sum: number }>,
): ProductPerformance[] {
  return allProducts.map((p) => {
    const sales = productSalesMap.get(p.id);
    const review = reviewMap.get(p.id);
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
      stock: resolveStockTotal(p),
      reserved: 0,
      avgRating: review ? review.sum / review.total : null,
      reviewCount: review?.total ?? 0,
      variantCount: p.product_variants?.length ?? 0,
    };
  });
}

export function buildCategoryBreakdown(
  productPerf: ProductPerformance[],
  categories: CategoryRow[],
): { name: string; revenue: number }[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categoryRevMap = new Map<string, number>();
  for (const p of productPerf) {
    if (p.categoryId && p.revenue > 0) {
      const name = categoryMap.get(p.categoryId) ?? "Бусад";
      categoryRevMap.set(name, (categoryRevMap.get(name) ?? 0) + p.revenue);
    }
  }
  return Array.from(categoryRevMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function buildInventoryAlerts(
  allProducts: ProductRow[],
  productSalesMap: Map<string, ProductSales>,
): InventoryAlert[] {
  return allProducts
    .filter((p) => {
      const stock = resolveStockTotal(p);
      return stock <= 5 && p.status === "active";
    })
    .map((p) => {
      const sales = productSalesMap.get(p.id);
      return {
        productId: p.id,
        name: p.name,
        imageUrl: sales?.imageUrl ?? null,
        stock: resolveStockTotal(p),
        reserved: 0,
      };
    })
    .sort((a, b) => a.stock - b.stock);
}
