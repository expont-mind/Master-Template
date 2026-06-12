"use client";

import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { OrderStatusHistoryEntry } from "./types";

interface OrderDeliveryServiceCardProps {
  statusHistory: OrderStatusHistoryEntry[];
  createdAt: string;
  paidAt: string | null;
}

function formatDate(dateString: string): string {
  const date = parseAsUTC(dateString);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

// Map status values to Mongolian labels
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  preparing: "Бэлтгэгдэж буй",
  confirmed: "Баталгаажсан",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  canceled: "Цуцлагдсан",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Захиалга хүлээгдэж буй",
  confirmed: "Захиалга баталгаажсан",
  canceled: "Захиалга цуцлагдсан",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Төлбөр хүлээгдэж буй",
  processing: "Төлбөр шалгагдаж буй",
  paid: "Төлбөр төлөгдсөн",
  failed: "Төлбөр амжилтгүй",
};

function getStatusLabel(statusType: string, status: string): string {
  if (statusType === "delivery") {
    return DELIVERY_STATUS_LABELS[status] || status;
  }
  if (statusType === "order") {
    return ORDER_STATUS_LABELS[status] || status;
  }
  if (statusType === "payment") {
    return PAYMENT_STATUS_LABELS[status] || status;
  }
  return status;
}

export function OrderDeliveryServiceCard({
  statusHistory,
  createdAt,
  paidAt,
}: OrderDeliveryServiceCardProps) {
  // Sort history by changed_at descending (most recent first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
  );

  // Filter to show only delivery-related history items
  const deliveryHistory = sortedHistory.filter((entry) => entry.status_type === "delivery");

  return (
    <Card>
      <CardHeader className="px-4 py-2">
        <CardTitle className="text-base font-semibold">Хүргэлтийн үйлчилгээ</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="flex flex-col gap-3">
          {/* Show delivery history entries */}
          {deliveryHistory.map((entry, index) => (
            <div key={entry.id} className="flex items-start gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-semibold ${
                    index === 0 ? "text-green-700" : "text-muted-foreground"
                  }`}
                >
                  {getStatusLabel("delivery", entry.new_status)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.changed_at)}
                </span>
              </div>
            </div>
          ))}

          {/* Show payment confirmation if paid */}
          {paidAt && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-muted-foreground">
                  Төлбөр төлөгдсөн
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(paidAt)}</span>
              </div>
            </div>
          )}

          {/* Always show order creation as the first event */}
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-semibold ${
                  deliveryHistory.length === 0 && !paidAt
                    ? "text-green-700"
                    : "text-muted-foreground"
                }`}
              >
                Захиалга үүсгэгдсэн
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
