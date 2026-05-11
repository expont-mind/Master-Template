"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell } from "@/components/ui/data-table";
import type { PaymentLog } from "@/hooks/usePaymentLogList";

const LOG_STATUS_LABELS: Record<string, string> = {
  info: "Мэдээлэл",
  error: "Алдаа",
  success: "Амжилттай",
};

const LOG_STATUS_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  error: "bg-red-100 text-red-800",
  success: "bg-green-100 text-green-800",
};

const PROVIDER_LABELS: Record<string, string> = {
  qpay: "QPay",
  lendmn: "LendMN",
  storepay: "StorePay",
};

export function getColumns(): ColumnDef<PaymentLog>[] {
  return [
    {
      accessorKey: "created_at",
      header: "Огноо",
      size: 155,
      cell: ({ row }) => (
        <DateCell value={row.original.created_at} showTime />
      ),
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 110,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={LOG_STATUS_LABELS}
          colors={LOG_STATUS_COLORS}
        />
      ),
    },
    {
      id: "provider",
      header: "Provider",
      size: 100,
      cell: ({ row }) => (
        <span className="font-medium">
          {PROVIDER_LABELS[row.original.provider ?? ""] ?? row.original.provider ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "event",
      header: "Event",
      size: 200,
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {row.original.event}
        </code>
      ),
    },
    {
      id: "invoice_id",
      header: "Invoice",
      size: 110,
      cell: ({ row }) =>
        row.original.invoice_id ? (
          <span className="text-muted-foreground text-xs font-mono">
            {row.original.invoice_id.slice(0, 8)}...
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "order_id",
      header: "Order",
      size: 110,
      cell: ({ row }) =>
        row.original.order_id ? (
          <span className="text-muted-foreground text-xs font-mono">
            {row.original.order_id.slice(0, 8)}...
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "message",
      header: "Мессеж",
      cell: ({ row }) =>
        row.original.message ? (
          <span className="text-sm text-muted-foreground line-clamp-2">
            {row.original.message}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];
}
