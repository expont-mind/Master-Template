"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell, PriceCell } from "@/components/ui/data-table";
import { USER_STATUS_LABELS, USER_STATUS_COLORS } from "@/constants";
import { User as UserIcon } from "lucide-react";
import { type User, getFullName } from "./types";

export function getColumns(): ColumnDef<User>[] {
  return [
    {
      id: "user",
      header: "Хэрэглэгч",
      cell: ({ row }) => {
        const fullName = getFullName(row.original);
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {row.original.avatar_url ? (
                <img
                  src={row.original.avatar_url}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "primary_phone",
      header: "Утас",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.primary_phone || "-"}
        </span>
      ),
    },
    {
      accessorKey: "point_balance",
      header: "Point",
      size: 120,
      cell: ({ row }) => {
        const balance = row.original.point_balance ?? 0;
        return (
          <span className="font-medium text-blue-600">
            {balance.toLocaleString()}P
          </span>
        );
      },
    },
    {
      accessorKey: "order_count",
      header: "Захиалга",
      size: 100,
      cell: ({ row }) => {
        const count = row.original.order_count ?? 0;
        return <span className="font-medium">{count.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "total_spent",
      header: "Зарцуулалт",
      size: 140,
      cell: ({ row }) => {
        const spent = row.original.total_spent ?? 0;
        return <PriceCell value={spent} />;
      },
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 120,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={USER_STATUS_LABELS}
          colors={USER_STATUS_COLORS}
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Бүртгүүлсэн",
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
  ];
}
