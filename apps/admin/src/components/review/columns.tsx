"use client";

import { Star } from "lucide-react";

import { BadgeCell, DateCell } from "@/components/ui/data-table";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS } from "@/constants";

import type { ReviewWithDetails } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(): ColumnDef<ReviewWithDetails>[] {
  return [
    {
      id: "rating",
      header: "Үнэлгээ",
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= row.original.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      id: "comment",
      header: "Сэтгэгдэл",
      cell: ({ row }) => (
        <p className="truncate max-w-[200px] text-muted-foreground">
          {row.original.comment || "-"}
        </p>
      ),
    },
    {
      id: "user",
      header: "Хэрэглэгч",
      size: 140,
      cell: ({ row }) => {
        const fullName = [row.original.users?.first_name, row.original.users?.last_name]
          .filter(Boolean)
          .join(" ");
        return (
          <span className="font-medium">
            {fullName || row.original.users?.email || "Хэрэглэгч"}
          </span>
        );
      },
    },
    {
      id: "product",
      header: "Бүтээгдэхүүн",
      size: 160,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.products?.name || "Бүтээгдэхүүн"}
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
          labels={REVIEW_STATUS_LABELS}
          colors={REVIEW_STATUS_COLORS}
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Огноо",
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
  ];
}
