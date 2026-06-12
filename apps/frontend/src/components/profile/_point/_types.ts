import { parseAsUTC } from "@/lib/utils/formatters";

export interface PointTransaction {
  id: string;
  type: "earned" | "used" | "promotional" | "refund";
  amount: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
  orders: { order_number: string | null } | null;
}

export interface PointFaq {
  id: string;
  question: string;
  answer: string;
}

export const POINT_TABS = ["Бүгд", "Ашигласан", "Нэмэгдсэн"] as const;

export function formatPointDate(dateStr: string): string {
  return parseAsUTC(dateStr)
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(", ", " · ");
}

export function filterTransactionsByTab(
  transactions: PointTransaction[],
  activeTab: number,
): PointTransaction[] {
  return transactions.filter((t) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return t.type === "used";
    return t.type === "earned" || t.type === "promotional" || t.type === "refund";
  });
}
