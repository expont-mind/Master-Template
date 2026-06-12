import { formatDateTime } from "./_date-helpers";

import type { ProfileOrder } from "@/app/profile/page";

export interface OrderStep {
  label: string;
  completed: boolean;
  isDelivered: boolean;
  timestamp: string | null;
}

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Хүргэлт хүлээгдэж буй",
  confirmed: "Хүргэлт баталгаажсан",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

/**
 * Build the 3-step order timeline (захиалга үүссэн → төлбөр → хүргэлт).
 */
export function buildOrderSteps(order: ProfileOrder): OrderStep[] {
  const isPaymentPaid = order.payment_status === "paid";
  const isOrderConfirmed = order.payment_status === "paid";
  const deliveryStatus = order.delivery_status;
  const isDeliveryVisible =
    isOrderConfirmed && isPaymentPaid && deliveryStatus && deliveryStatus !== "pending";
  const isDelivered = deliveryStatus === "delivered";

  return [
    {
      label: "Захиалга үүссэн",
      completed: true,
      isDelivered: false,
      timestamp: formatDateTime(order.created_at),
    },
    {
      label: "Төлбөр баталгаажуулах",
      completed: isPaymentPaid,
      isDelivered: false,
      timestamp: isPaymentPaid ? formatDateTime(order.created_at) : null,
    },
    {
      label:
        isDeliveryVisible && deliveryStatus
          ? (DELIVERY_STATUS_LABELS[deliveryStatus] ?? "Бараа хүргэх")
          : "Бараа хүргэх",
      completed: isDelivered,
      isDelivered,
      timestamp: isDelivered && order.updated_at ? formatDateTime(order.updated_at) : null,
    },
  ];
}

export type StepState = "completed" | "next" | "future";

export function resolveStepState(step: OrderStep, index: number, nextStepIndex: number): StepState {
  if (step.completed) return "completed";
  if (index === nextStepIndex) return "next";
  return "future";
}
