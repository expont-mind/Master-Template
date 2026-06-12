// Color/label config for order delivery_status badges, shared across
// the order detail view and any future order-related components.

export const deliveryStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: {
    label: "Баталгаажсан",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  confirmed: {
    label: "Баталгаажсан",
    bg: "bg-status-warning-bg",
    text: "text-status-warning-text",
  },
  shipped: {
    label: "Хүргэлтэнд гарсан",
    bg: "bg-status-info-bg",
    text: "text-status-info-text",
  },
  delivered: {
    label: "Хүргэгдсэн",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
  cancelled: {
    label: "Цуцлагдсан",
    bg: "bg-status-error-bg",
    text: "text-status-error-text",
  },
};
