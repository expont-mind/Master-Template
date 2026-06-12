"use client";

import { BadgeCell, DateCell } from "@/components/ui/data-table";
import { POINT_TYPE_LABELS, POINT_TYPE_COLORS } from "@/constants";

import type { PointTransaction } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getPointTransactionColumns(): ColumnDef<PointTransaction>[] {
  return [
    {
      id: "user",
      header: "Хэрэглэгч",
      cell: ({ row }) => {
        const user = row.original.users;
        if (!user) return <span className="text-muted-foreground">-</span>;
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
        return <span className="font-medium">{name || "-"}</span>;
      },
    },
    {
      id: "phone",
      header: "Утас",
      size: 130,
      cell: ({ row }) => {
        const phone = row.original.users?.primary_phone;
        return <span className={phone ? "" : "text-muted-foreground"}>{phone || "-"}</span>;
      },
    },
    {
      accessorKey: "amount",
      header: "Дүн",
      size: 120,
      cell: ({ row }) => (
        <span
          className={
            row.original.amount > 0 ? "font-medium text-green-600" : "font-medium text-red-600"
          }
        >
          {row.original.amount > 0 ? "+" : ""}
          {row.original.amount.toLocaleString()} M
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
          labels={POINT_TYPE_LABELS as unknown as Record<string, string>}
          colors={POINT_TYPE_COLORS as unknown as Record<string, string>}
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Тайлбар",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Огноо",
      size: 160,
      cell: ({ row }) => <DateCell value={row.original.created_at} showTime />,
    },
  ];
}
