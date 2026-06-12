"use client";

import { BadgeCell, DateCell, PriceCell } from "@/components/ui/data-table";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  PAYMENT_PROVIDER_LABELS,
} from "@/constants";

import type { PaymentWithOrder } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(): ColumnDef<PaymentWithOrder>[] {
  return [
    {
      id: "payment_id",
      header: "Төлбөр ID",
      size: 120,
      cell: ({ row }) => <span className="font-medium">#{row.original.id.slice(0, 8)}</span>,
    },
    {
      id: "order_id",
      header: "Захиалга",
      size: 120,
      cell: ({ row }) => (
        <span className="text-muted-foreground">#{row.original.order_id.slice(0, 8)}</span>
      ),
    },
    {
      id: "user",
      header: "Хэрэглэгч",
      cell: ({ row }) => {
        const fullName = [
          row.original.orders?.users?.first_name,
          row.original.orders?.users?.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div>
            <div className="font-medium">
              {fullName || row.original.orders?.users?.email || "Хэрэглэгч"}
            </div>
            {row.original.orders?.users?.primary_phone && (
              <div className="text-sm text-muted-foreground">
                {row.original.orders.users.primary_phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "provider",
      header: "Төлбөрийн хэрэгсэл",
      size: 140,
      cell: ({ row }) => (
        <span>
          {PAYMENT_PROVIDER_LABELS[row.original.provider as keyof typeof PAYMENT_PROVIDER_LABELS] ||
            row.original.provider}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 130,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={TRANSACTION_STATUS_LABELS}
          colors={TRANSACTION_STATUS_COLORS}
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Огноо",
      size: 160,
      cell: ({ row }) => <DateCell value={row.original.created_at} showTime />,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Дүн</div>,
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          <PriceCell value={row.original.amount} />
        </div>
      ),
    },
  ];
}
