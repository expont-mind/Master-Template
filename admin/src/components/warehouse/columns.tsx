"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { WAREHOUSE_TYPE_LABELS } from "./types";
import type { Warehouse } from "./types";

const WAREHOUSE_TYPE_COLORS: Record<string, string> = {
  main: "bg-blue-100 text-blue-800",
  secondary: "bg-purple-100 text-purple-800",
  distribution: "bg-orange-100 text-orange-800",
};

export function getColumns(options: {
  onDelete?: (item: Warehouse) => void;
}): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <span
          className="font-medium"
          style={row.original.name_color ? { color: row.original.name_color } : undefined}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Төрөл",
      size: 120,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.type}
          labels={WAREHOUSE_TYPE_LABELS as unknown as Record<string, string>}
          colors={WAREHOUSE_TYPE_COLORS}
        />
      ),
    },
    {
      accessorKey: "address",
      header: "Хаяг",
      size: 240,
      cell: ({ row }) => {
        const address = row.original.address;
        if (!address) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-muted-foreground line-clamp-1">{address}</span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Төлөв",
      size: 100,
      cell: ({ row }) => (
        <BadgeCell
          value={String(row.original.is_active)}
          labels={{ true: "Идэвхтэй", false: "Идэвхгүй" }}
          colors={{
            true: "bg-green-100 text-green-800",
            false: "bg-gray-100 text-gray-800",
          }}
        />
      ),
    },
    {
      accessorKey: "is_default",
      header: "Үндсэн",
      size: 100,
      cell: ({ row }) => (
        <BadgeCell
          value={String(row.original.is_default)}
          labels={{ true: "Үндсэн", false: "" }}
          colors={{
            true: "bg-blue-100 text-blue-800",
            false: "",
          }}
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
          editHref={`/warehouses/${row.original.id}`}
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
