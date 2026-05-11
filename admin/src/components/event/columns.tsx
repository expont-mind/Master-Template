"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/constants";
import type { Event } from "./types";

export function getColumns(options: {
  onDelete?: (event: Event) => void;
}): ColumnDef<Event>[] {
  return [
    {
      accessorKey: "title",
      header: "Гарчиг",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "location",
      header: "Байршил",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.location || "-"}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: "Эхлэх огноо",
      size: 140,
      cell: ({ row }) =>
        row.original.start_date ? (
          <DateCell value={row.original.start_date} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "end_date",
      header: "Дуусах огноо",
      size: 140,
      cell: ({ row }) =>
        row.original.end_date ? (
          <DateCell value={row.original.end_date} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 120,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={CONTENT_STATUS_LABELS}
          colors={CONTENT_STATUS_COLORS}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/events/${row.original.id}`}
          onDelete={
            options.onDelete
              ? () => options.onDelete!(row.original)
              : undefined
          }
        />
      ),
    },
  ];
}
