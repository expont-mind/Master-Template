"use client";

import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS, FAQ_CATEGORIES } from "@/constants";

import type { FAQ } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(options: { onDelete?: (item: FAQ) => void }): ColumnDef<FAQ>[] {
  return [
    {
      accessorKey: "question",
      header: "Асуулт",
      cell: ({ row }) => <span className="font-medium line-clamp-1">{row.original.question}</span>,
    },
    {
      accessorKey: "category",
      header: "Ангилал",
      size: 120,
      cell: ({ row }) => {
        const category = row.original.category;
        if (!category) return <span className="text-muted-foreground">-</span>;
        return (
          <BadgeCell
            value={category}
            labels={FAQ_CATEGORIES as unknown as Record<string, string>}
            colors={{}}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 120,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={CONTENT_STATUS_LABELS as unknown as Record<string, string>}
          colors={CONTENT_STATUS_COLORS as unknown as Record<string, string>}
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Үүсгэсэн",
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/faqs/${row.original.id}`}
          onDelete={options.onDelete ? () => options.onDelete!(row.original) : undefined}
        />
      ),
    },
  ];
}
