"use client";

import { BadgeCell, PriceCell, ActionsCell } from "@/components/ui/data-table";

import type { DeliveryZone } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(options: {
  onDelete?: (item: DeliveryZone) => void;
}): ColumnDef<DeliveryZone>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "description",
      header: "Тайлбар",
      size: 200,
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground">-</span>;
        return <span className="text-muted-foreground line-clamp-1">{desc}</span>;
      },
    },
    {
      accessorKey: "delivery_fee",
      header: "Хүргэлтийн төлбөр",
      size: 160,
      cell: ({ row }) => <PriceCell value={row.original.delivery_fee} />,
    },
    {
      accessorKey: "free_delivery_threshold",
      header: "Үнэгүй хүргэлт",
      size: 160,
      cell: ({ row }) => {
        const threshold = row.original.free_delivery_threshold;
        if (!threshold) return <span className="text-muted-foreground">-</span>;
        return <PriceCell value={threshold} />;
      },
    },
    {
      id: "estimated_days",
      header: "Хүргэх хугацаа",
      size: 140,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.estimated_days_min}-{row.original.estimated_days_max} хоног
        </span>
      ),
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
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/deliveries/${row.original.id}`}
          onDelete={options.onDelete ? () => options.onDelete!(row.original) : undefined}
        />
      ),
    },
  ];
}
