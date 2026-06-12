import type { ProfileOrder } from "@/app/profile/page";

export type EmbeddedOrderItem = {
  id: string;
  product_id: string;
  price: number;
  quantity: number;
  variant_name: string | null;
  products: {
    name: string;
    slug: string;
    price: number;
    discount_price: number | null;
  } | null;
};

export type OrderRowEmbed = {
  id: string;
  order_number: string;
  status: string;
  delivery_status: string | null;
  total_amount: number;
  points_used: number | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: EmbeddedOrderItem[] | null;
};

export function collectProductIds(orders: OrderRowEmbed[]): string[] {
  return [
    ...new Set(orders.flatMap((o) => (o.order_items ?? []).map((item) => item.product_id))),
  ].filter(Boolean) as string[];
}

export function buildProductImagesMap(
  rows:
    | ReadonlyArray<{
        product_id: string;
        url: string;
        sort_order: number | null;
      }>
    | null
    | undefined,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const img of rows ?? []) {
    const existing = map.get(img.product_id) || [];
    existing.push(img.url);
    map.set(img.product_id, existing);
  }
  return map;
}

export function buildPaymentWalletMap(
  rows:
    | ReadonlyArray<{ order_id: string | null; payment_wallet: string | null }>
    | null
    | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const inv of rows ?? []) {
    if (inv.order_id && inv.payment_wallet) {
      map.set(inv.order_id, inv.payment_wallet);
    }
  }
  return map;
}

export function buildCouponUsageMap(
  rows:
    | ReadonlyArray<{
        order_id: string | null;
        discount_amount: number;
        coupon_id: string;
        coupons: { code: string } | null;
      }>
    | null
    | undefined,
): Map<string, { discount_amount: number; code: string }> {
  const map = new Map<string, { discount_amount: number; code: string }>();
  for (const cu of rows ?? []) {
    if (cu.order_id) {
      map.set(cu.order_id, {
        discount_amount: Number(cu.discount_amount ?? 0),
        code: cu.coupons?.code ?? "",
      });
    }
  }
  return map;
}

export function assembleProfileOrders(
  ordersData: OrderRowEmbed[],
  productImagesMap: Map<string, string[]>,
  paymentWalletMap: Map<string, string>,
  couponUsageMap: Map<string, { discount_amount: number; code: string }>,
): ProfileOrder[] {
  return ordersData.map((order) => {
    const couponUsage = couponUsageMap.get(order.id);
    return {
      ...order,
      payment_wallet: paymentWalletMap.get(order.id) ?? null,
      coupon_discount: couponUsage?.discount_amount ?? 0,
      coupon_code: couponUsage?.code ?? null,
      items: (order.order_items ?? []).map((item) => ({
        ...item,
        products: item.products
          ? {
              ...item.products,
              images: productImagesMap.get(item.product_id) ?? [],
            }
          : null,
      })),
    } as unknown as ProfileOrder;
  });
}
