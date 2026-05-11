"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ImageCell,
  BadgeCell,
  ActionsCell,
} from "@/components/ui/data-table";
import type { BankAccount } from "./types";

export function getColumns(options: {
  onDelete?: (item: BankAccount) => void;
}): ColumnDef<BankAccount>[] {
  return [
    {
      accessorKey: "logo_url",
      header: "",
      size: 60,
      cell: ({ row }) => (
        <ImageCell
          src={row.original.logo_url}
          alt={row.original.bank_name}
        />
      ),
    },
    {
      accessorKey: "bank_name",
      header: "Банк",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.bank_name}</span>
      ),
    },
    {
      accessorKey: "account_name",
      header: "Дансны нэр",
      cell: ({ row }) => <span>{row.original.account_name}</span>,
    },
    {
      accessorKey: "account_number",
      header: "Дансны дугаар",
      size: 160,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.account_number}</span>
      ),
    },
    {
      accessorKey: "currency",
      header: "Валют",
      size: 80,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.currency}</span>
      ),
    },
    {
      accessorKey: "is_default",
      header: "Үндсэн",
      size: 100,
      cell: ({ row }) => {
        if (!row.original.is_default) return null;
        return (
          <BadgeCell
            value="true"
            labels={{ true: "Үндсэн" }}
            colors={{ true: "bg-blue-100 text-blue-800" }}
          />
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
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/bank-accounts/${row.original.id}`}
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
