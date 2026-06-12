import type { ProfileOrder } from "@/app/profile/page";

export interface OrderPricingInputs {
  order: ProfileOrder;
  isPaymentUnpaid: boolean;
  retryTotalAmount: number | null;
  pointsUsed: number;
}

export interface OrderPricing {
  subtotal: number;
  totalDiscount: number;
  couponDiscount: number;
  displayTotal: number;
  itemsTotal: number;
  deliveryFee: number;
  totalCount: number;
  effectivePointsUsed: number;
}

/**
 * Computes the price breakdown shown on the order detail view.
 *
 * For paid orders, `total_amount` already has points deducted, so points
 * are added back when deriving the delivery fee. For unpaid (or retry)
 * orders, `displayTotal` includes full price (points added back), so no
 * adjustment is needed.
 */
export function calculateOrderPricing({
  order,
  isPaymentUnpaid,
  retryTotalAmount,
  pointsUsed,
}: OrderPricingInputs): OrderPricing {
  const items = order.items ?? [];

  const subtotal = items.reduce(
    (sum, item) => sum + (item.products?.price ?? item.price) * item.quantity,
    0,
  );
  const totalDiscount = items.reduce((sum, item) => {
    const originalPrice = item.products?.price ?? item.price;
    return sum + (originalPrice - item.price) * item.quantity;
  }, 0);

  const isRetry = isPaymentUnpaid || retryTotalAmount !== null;
  const couponDiscount = isRetry ? 0 : (order.coupon_discount ?? 0);
  const displayTotal =
    retryTotalAmount ??
    (isPaymentUnpaid
      ? order.total_amount + (order.coupon_discount ?? 0) + (order.points_used ?? 0)
      : order.total_amount);
  const itemsTotal = subtotal - totalDiscount - couponDiscount;
  const paidPointsAdjust = isRetry ? 0 : (order.points_used ?? 0);
  const deliveryFee = Math.max(0, displayTotal + paidPointsAdjust - itemsTotal);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const effectivePointsUsed = isRetry ? 0 : pointsUsed;

  return {
    subtotal,
    totalDiscount,
    couponDiscount,
    displayTotal,
    itemsTotal,
    deliveryFee,
    totalCount,
    effectivePointsUsed,
  };
}
