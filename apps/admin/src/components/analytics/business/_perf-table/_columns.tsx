"use client";

import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { PRODUCT_STATUS_COLORS, PRODUCT_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

import { SortIcon } from "./_SortIcon";
import { type PerfRow } from "./_types";

import type { Column, ColumnDef } from "@tanstack/react-table";

function SortableHeader({ column, label }: { column: Column<PerfRow>; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <SortIcon isSorted={column.getIsSorted()} />
    </button>
  );
}

function NameCell({
  product,
  isExpanded,
  onToggle,
}: {
  product: PerfRow;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  const hasVariants = product.variant_count > 0;
  return (
    <div className="flex items-center gap-1.5">
      {hasVariants ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(product.id);
          }}
          className="shrink-0 rounded p-0.5 hover:bg-muted"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span className="w-5" />
      )}
      <Link href={`/analytics/products/${product.id}`} className="hover:underline font-medium">
        {product.name}
      </Link>
    </div>
  );
}

function PriceCell({ product }: { product: PerfRow }) {
  if (product.discount_price) {
    return (
      <div className="text-right">
        <span className="text-xs text-muted-foreground line-through">
          ₮{product.price.toLocaleString()}
        </span>
        <span className="ml-1 font-medium text-red-600">
          ₮{product.discount_price.toLocaleString()}
        </span>
      </div>
    );
  }
  return <div className="text-right">₮{product.price.toLocaleString()}</div>;
}

function stockClassName(stock: number): string {
  if (stock === 0) return "text-red-600 font-medium";
  if (stock <= 5) return "text-yellow-600 font-medium";
  return "";
}

function RatingCell({ product }: { product: PerfRow }) {
  if (product.avg_rating === null) {
    return <div className="text-right text-muted-foreground">—</div>;
  }
  return (
    <div className="text-right">
      <span className="inline-flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        {Number(product.avg_rating).toFixed(1)}
        <span className="text-muted-foreground text-xs">({product.review_count})</span>
      </span>
    </div>
  );
}

export function useProductPerformanceColumns(
  expandedProductId: string | null,
  onToggleExpand: (id: string) => void,
): ColumnDef<PerfRow>[] {
  return useMemo<ColumnDef<PerfRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} label="Нэр" />,
        cell: ({ row }) => (
          <NameCell
            product={row.original}
            isExpanded={expandedProductId === row.original.id}
            onToggle={onToggleExpand}
          />
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <SortableHeader column={column} label="Үнэ" />,
        cell: ({ row }) => <PriceCell product={row.original} />,
      },
      {
        accessorKey: "status",
        header: "Төлөв",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              PRODUCT_STATUS_COLORS[row.original.status as keyof typeof PRODUCT_STATUS_COLORS] ?? ""
            }
          >
            {PRODUCT_STATUS_LABELS[row.original.status as keyof typeof PRODUCT_STATUS_LABELS] ??
              row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "qtySold",
        accessorFn: (row) => row.qty_sold,
        header: ({ column }) => <SortableHeader column={column} label="Зарагдсан" />,
        cell: ({ row }) => (
          <div className="text-right">{row.original.qty_sold.toLocaleString()}</div>
        ),
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => <SortableHeader column={column} label="Орлого" />,
        cell: ({ row }) => (
          <div className="text-right">₮{row.original.revenue.toLocaleString()}</div>
        ),
      },
      {
        accessorKey: "stock",
        header: ({ column }) => <SortableHeader column={column} label="Нөөц" />,
        cell: ({ row }) => (
          <div className="text-right">
            <span className={stockClassName(row.original.stock)}>{row.original.stock}</span>
          </div>
        ),
      },
      {
        accessorKey: "variantCount",
        accessorFn: (row) => row.variant_count,
        header: ({ column }) => <SortableHeader column={column} label="Опцион" />,
        cell: ({ row }) => <div className="text-right">{row.original.variant_count}</div>,
      },
      {
        accessorKey: "avgRating",
        accessorFn: (row) => row.avg_rating,
        header: ({ column }) => <SortableHeader column={column} label="Үнэлгээ" />,
        cell: ({ row }) => <RatingCell product={row.original} />,
      },
    ],
    [expandedProductId, onToggleExpand],
  );
}
