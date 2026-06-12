import type { OrderWithUser } from "./types";

export interface VariantInfo {
  variantName: string | null;
  quantity: number;
  orderNumbers: string[];
}

export interface GroupedProduct {
  productName: string;
  imageUrl: string | null;
  totalQuantity: number;
  variants: VariantInfo[];
  orderNumbers: string[];
}

type OrderItem = NonNullable<OrderWithUser["order_items"]>[number];

type ProductBucket = {
  imageUrl: string | null;
  variants: Map<string, { quantity: number; orderNumbers: Set<string> }>;
  allOrderNumbers: Set<string>;
};

function resolveProductImage(item: OrderItem): string | null {
  const images = item.products?.product_images;
  if (!images || images.length === 0) return null;
  const primary = images.find((img: { is_primary: boolean }) => img.is_primary);
  return (primary ?? images[0])?.url ?? null;
}

function accumulateItem(
  productMap: Map<string, ProductBucket>,
  item: OrderItem,
  orderNum: string,
): void {
  const productName = item.products?.name || "Unknown";
  const variantKey = item.variant_name || "";

  let bucket = productMap.get(productName);
  if (!bucket) {
    bucket = {
      imageUrl: resolveProductImage(item),
      variants: new Map(),
      allOrderNumbers: new Set(),
    };
    productMap.set(productName, bucket);
  }

  bucket.allOrderNumbers.add(orderNum);
  const variant = bucket.variants.get(variantKey);
  if (variant) {
    variant.quantity += item.quantity;
    variant.orderNumbers.add(orderNum);
    return;
  }
  bucket.variants.set(variantKey, {
    quantity: item.quantity,
    orderNumbers: new Set([orderNum]),
  });
}

function bucketToGroupedProduct(productName: string, bucket: ProductBucket): GroupedProduct {
  let totalQuantity = 0;
  const variants: VariantInfo[] = [];
  for (const [variantName, v] of bucket.variants) {
    variants.push({
      variantName: variantName || null,
      quantity: v.quantity,
      orderNumbers: [...v.orderNumbers],
    });
    totalQuantity += v.quantity;
  }
  variants.sort((a, b) => b.quantity - a.quantity);
  return {
    productName,
    imageUrl: bucket.imageUrl,
    totalQuantity,
    variants,
    orderNumbers: [...bucket.allOrderNumbers],
  };
}

/**
 * Group order_items by product name → variant. Skips returned items.
 * Returns alphabetically sorted products, each with its variants sorted
 * by descending quantity.
 */
export function groupOrderItemsByProduct(orders: OrderWithUser[]): GroupedProduct[] {
  const productMap = new Map<string, ProductBucket>();

  for (const order of orders) {
    const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();
    for (const item of order.order_items || []) {
      if (item.is_returned) continue;
      accumulateItem(productMap, item, orderNum);
    }
  }

  const result: GroupedProduct[] = [];
  for (const [productName, bucket] of productMap) {
    result.push(bucketToGroupedProduct(productName, bucket));
  }
  return result.sort((a, b) => a.productName.localeCompare(b.productName));
}

export function filterGroupedProducts(
  grouped: GroupedProduct[],
  searchQuery: string,
): GroupedProduct[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return grouped;
  return grouped.filter(
    (g) =>
      g.productName.toLowerCase().includes(q) ||
      g.variants.some((v) => v.variantName?.toLowerCase().includes(q)),
  );
}

export function hasMultipleVariants(g: GroupedProduct): boolean {
  return g.variants.length > 1 || (g.variants.length === 1 && Boolean(g.variants[0].variantName));
}
