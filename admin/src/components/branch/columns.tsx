"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import type { Branch } from "./types";

export function getColumns(options: {
  onDelete?: (item: Branch) => void;
}): ColumnDef<Branch>[] {
  return [
    {
      accessorKey: "image_url",
      header: "",
      size: 60,
      cell: ({ row }) => {
        const imageUrl = row.original.image_url;
        if (!imageUrl) {
          return (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
              -
            </div>
          );
        }
        return (
          <img
            src={imageUrl}
            alt={row.original.name}
            className="w-10 h-10 object-cover rounded"
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Утас",
      size: 140,
      cell: ({ row }) => {
        const phone = row.original.phone;
        if (!phone) return <span className="text-muted-foreground">-</span>;
        return <span>{phone}</span>;
      },
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
        <ActionsCell
          editHref={`/branches/${row.original.id}`}
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
