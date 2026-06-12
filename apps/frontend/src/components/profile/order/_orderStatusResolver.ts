import { deliveryStatusConfig } from "./_status-config";

export interface StatusBadge {
  label: string;
  bg: string;
  text: string;
}

const UNPAID_BADGE: StatusBadge = {
  label: "Төлбөр хийгдээгүй",
  bg: "bg-rose-50",
  text: "text-rose-600",
};

export function isUnpaidStatus(paymentStatus: string): boolean {
  return paymentStatus === "unpaid" || paymentStatus === "processing";
}

export function resolveOrderBadge(
  paymentStatus: string,
  deliveryStatus: string | null,
): StatusBadge {
  if (isUnpaidStatus(paymentStatus)) return UNPAID_BADGE;
  return deliveryStatusConfig[deliveryStatus ?? "pending"] ?? deliveryStatusConfig.pending;
}
