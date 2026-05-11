"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ImageCell,
  ActionsCell,
} from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import type { Banner } from "./types";

export function getColumns(options: {
  onDelete?: (banner: Banner) => void;
  onToggleActive?: (id: string, checked: boolean) => void;
}): ColumnDef<Banner>[] {
  return [
    {
      id: "image",
      header: "Зураг",
      size: 120,
      cell: ({ row }) => (
        <ImageCell src={row.original.image_url} alt="Banner" />
      ),
    },
    {
      id: "background_color",
      header: "Дэвсгэр өнгө",
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border shadow-sm"
            style={{ backgroundColor: row.original.background_color }}
          />
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.background_color}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sort_order",
      header: "Дараалал",
      size: 80,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.sort_order}</span>
      ),
    },
    {
      id: "is_active",
      header: "Идэвхтэй",
      size: 80,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={row.original.is_active}
            onCheckedChange={(checked) =>
              options.onToggleActive?.(row.original.id, checked)
            }
          />
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/banners/${row.original.id}`}
          onDelete={() => options.onDelete?.(row.original)}
        />
      ),
    },
  ];
}
