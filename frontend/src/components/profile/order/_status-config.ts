// Color/label config for order delivery_status badges, shared across
// the order detail view and any future order-related components.

export const deliveryStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Баталгаажсан",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  confirmed: {
    label: "Баталгаажсан",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
  },
  shipped: {
    label: "Хүргэлтэнд гарсан",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
  },
  delivered: {
    label: "Хүргэгдсэн",
    bg: "bg-[#F0FDFA]",
    text: "text-[#0D9488]",
  },
  cancelled: {
    label: "Цуцлагдсан",
    bg: "bg-[#FFF1F2]",
    text: "text-[#E11D48]",
  },
};
