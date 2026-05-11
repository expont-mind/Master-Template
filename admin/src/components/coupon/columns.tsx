"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { COUPON_TYPE_LABELS } from "@/constants";
import type { Coupon } from "./types";
import type { CouponType } from "@/types/database";

const COUPON_TYPE_COLORS: Record<string, string> = {
  fixed: "bg-blue-100 text-blue-800",
  percentage: "bg-purple-100 text-purple-800",
  free_shipping: "bg-green-100 text-green-800",
};

function formatValue(type: CouponType, value: number): string {
  if (type === "percentage") return `${value}%`;
  if (type === "fixed") return `${value.toLocaleString()}₮`;
  return "Үнэгүй хүргэлт";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function getColumns(options: {
  onDelete?: (coupon: Coupon) => void;
  onToggleActive?: (id: string, checked: boolean) => void;
}): ColumnDef<Coupon>[] {
  return [
    {
      accessorKey: "code",
      header: "Код",
      size: 140,
      cell: ({ row }) => (
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
          {row.original.code}
        </code>
      ),
    },
    {
      id: "type",
      header: "Төрөл",
      size: 140,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.type}
          labels={COUPON_TYPE_LABELS}
          colors={COUPON_TYPE_COLORS}
        />
      ),
    },
    {
      id: "value",
      header: "Хөнгөлөлт",
      size: 130,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatValue(row.original.type, row.original.discount_value)}
        </span>
      ),
    },
    {
      id: "usage",
      header: "Ашиглалт",
      size: 100,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.usage_count}
          {row.original.usage_limit != null && ` / ${row.original.usage_limit}`}
        </span>
      ),
    },
    {
      id: "date_range",
      header: "Хугацаа",
      size: 180,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.start_date)} -{" "}
          {formatDate(row.original.end_date)}
        </span>
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
          editHref={`/coupons/${row.original.id}`}
          onDelete={() => options.onDelete?.(row.original)}
        />
      ),
    },
  ];
}
