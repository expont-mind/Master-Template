"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ImageCell, BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { AD_POSITION_LABELS } from "./types";
import type { Ad } from "./types";

const AD_POSITION_COLORS: Record<string, string> = {
  home: "bg-blue-100 text-blue-800",
  category: "bg-purple-100 text-purple-800",
  product: "bg-green-100 text-green-800",
  search: "bg-orange-100 text-orange-800",
  checkout: "bg-red-100 text-red-800",
};

const ACTIVE_LABELS: Record<string, string> = {
  true: "Идэвхтэй",
  false: "Идэвхгүй",
};

const ACTIVE_COLORS: Record<string, string> = {
  true: "bg-green-100 text-green-800",
  false: "bg-gray-100 text-gray-800",
};

export function getColumns(options: {
  onDelete?: (ad: Ad) => void;
}): ColumnDef<Ad>[] {
  return [
    {
      id: "image",
      header: "Зураг",
      size: 80,
      cell: ({ row }) => (
        <ImageCell src={row.original.image_url} alt={row.original.title} />
      ),
    },
    {
      accessorKey: "title",
      header: "Гарчиг",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "position",
      header: "Байршил",
      size: 140,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.position}
          labels={AD_POSITION_LABELS}
          colors={AD_POSITION_COLORS}
        />
      ),
    },
    {
      id: "is_active",
      header: "Төлөв",
      size: 100,
      cell: ({ row }) => (
        <BadgeCell
          value={String(row.original.is_active)}
          labels={ACTIVE_LABELS}
          colors={ACTIVE_COLORS}
        />
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
      accessorKey: "created_at",
      header: "Огноо",
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/ads/${row.original.id}`}
          onDelete={() => options.onDelete?.(row.original)}
        />
      ),
    },
  ];
}
