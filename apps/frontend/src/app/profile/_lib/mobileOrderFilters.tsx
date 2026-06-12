import { Box, TruckGray, BoxCancel } from "@/components/svg";

import type { ProfileOrder } from "@/app/profile/page";

export const MOBILE_ORDER_TABS = ["Захиалсан", "Хүргэгдсэн", "Цуцлагдсан"] as const;

export function filterOrderByTab(order: ProfileOrder, tabIndex: number): boolean {
  if (tabIndex === 1) return order.delivery_status === "delivered";
  if (tabIndex === 2) {
    return order.payment_status === "failed" || order.delivery_status === "canceled";
  }
  return (
    order.delivery_status !== "delivered" &&
    order.delivery_status !== "canceled" &&
    order.payment_status !== "failed"
  );
}

export const MOBILE_ORDER_EMPTY_STATES: Record<number, { icon: React.ReactNode; text: string }> = {
  0: { icon: <Box />, text: "Захиалсан бараа алга байна" },
  1: { icon: <TruckGray />, text: "Хүргэгдсэн бараа алга байна" },
  2: { icon: <BoxCancel />, text: "Цуцлагдсан бараа алга байна" },
};
