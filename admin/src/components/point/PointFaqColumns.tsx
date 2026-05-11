"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_COLORS,
} from "@/constants";
import type { PointFaq } from "./types";

export function getPointFaqColumns(options: {
  onEdit?: (item: PointFaq) => void;
  onDelete?: (item: PointFaq) => void;
}): ColumnDef<PointFaq>[] {
  return [
    {
      accessorKey: "question",
      header: "Асуулт",
      cell: ({ row }) => (
        <span className="font-medium line-clamp-1">
          {row.original.question}
        </span>
      ),
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
      accessorKey: "sort_order",
      header: "Эрэмбэ",
      size: 80,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.sort_order}</span>
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
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {options.onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => options.onEdit!(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {options.onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => options.onDelete!(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}
