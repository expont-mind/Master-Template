"use client";

import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { SMS_STATUS_LABELS, SMS_STATUS_COLORS } from "@/constants";

import type { SmsCampaign } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(options: {
  onDelete?: (campaign: SmsCampaign) => void;
}): ColumnDef<SmsCampaign>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      size: 200,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "message",
      header: "Мессеж",
      size: 250,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm line-clamp-2">{row.original.message}</span>
      ),
    },
    {
      id: "status",
      header: "Төлөв",
      size: 130,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={SMS_STATUS_LABELS}
          colors={SMS_STATUS_COLORS}
        />
      ),
    },
    {
      id: "recipients",
      header: "Хүлээн авагч",
      size: 120,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.sent_count} / {row.original.recipient_count}
        </span>
      ),
    },
    {
      id: "sent_at",
      header: "Илгээсэн",
      size: 150,
      cell: ({ row }) => <DateCell value={row.original.sent_at ?? row.original.created_at} />,
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/sms-campaigns/${row.original.id}`}
          onDelete={
            row.original.status === "draft" ? () => options.onDelete?.(row.original) : undefined
          }
        />
      ),
    },
  ];
}
