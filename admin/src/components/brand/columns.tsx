"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ImageCell, ActionsCell } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Brand } from "./types";

export function getColumns(options: {
  onDelete?: (item: Brand) => void;
  onProducts?: (item: Brand) => void;
}): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: "logo_url",
      header: "",
      size: 60,
      cell: ({ row }) => (
        <ImageCell src={row.original.logo_url} alt={row.original.name} />
      ),
    },
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "products",
      header: "",
      size: 48,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            options.onProducts?.(row.original);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/brands/${row.original.id}`}
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
