"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageCell, PriceCell } from "@/components/ui/data-table";
import { PRODUCT_STATUS_LABELS } from "@/constants";
import { MoreVertical, Pencil, Copy, Trash2, QrCode } from "lucide-react";
import type { Product } from "./types";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  draft: "bg-yellow-100 text-yellow-800",
};

export function getColumns(options: {
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onQrClick?: (product: Product) => void;
}): ColumnDef<Product>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="pl-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Бүгдийг сонгох"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="pl-2" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Мөр сонгох"
          />
        </div>
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "image",
      header: "Зураг",
      size: 72,
      cell: ({ row }) => {
        const primaryImage = row.original.product_images?.find(
          (img) => img.is_primary,
        );
        return <ImageCell src={primaryImage?.url} alt={row.original.name} />;
      },
    },
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="font-medium">{row.original.name}</p>
        </div>
      ),
    },
    {
      id: "price",
      header: "Үнэ",
      size: 140,
      cell: ({ row }) => {
        const variants = row.original.product_variants;
        const defaultVariant = variants?.find((v) => v.is_default && v.status === "active")
          ?? variants?.find((v) => v.status === "active");
        const price = defaultVariant?.price ?? row.original.price;
        const discount = defaultVariant?.discount_price ?? row.original.discount_price;
        const hasDiscount = discount != null && discount > 0 && discount < price;

        if (hasDiscount) {
          return (
            <div className="flex flex-col">
              <PriceCell value={discount} />
              <span className="text-xs text-muted-foreground line-through">
                {price.toLocaleString()}₮
              </span>
            </div>
          );
        }
        return <PriceCell value={price} />;
      },
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="secondary" className={STATUS_COLORS[status]}>
            {status === "active" && <span className="mr-1">●</span>}
            {PRODUCT_STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      id: "category",
      header: "Ангилал",
      size: 120,
      cell: ({ row }) => {
        const categories = row.original.product_categories;
        if (!categories || categories.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((pc) => (
              <Badge
                key={pc.category_id}
                variant="secondary"
                className="bg-gray-100 text-gray-700"
              >
                {pc.categories?.name ?? "—"}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "stock",
      header: "Тоо",
      size: 80,
      cell: ({ row }) => {
        const variants = row.original.product_variants;
        const activeVariants = variants?.filter((v) => v.status === "active");
        const stock =
          activeVariants && activeVariants.length > 1
            ? activeVariants.reduce((sum, v) => sum + v.stock_quantity, 0)
            : row.original.stock_quantity ?? 0;
        return <span className="text-muted-foreground">{stock}</span>;
      },
    },
    {
      id: "created_at",
      header: "Огноо",
      size: 100,
      cell: ({ row }) => {
        const d = row.original.created_at;
        if (!d) return <span className="text-muted-foreground">—</span>;
        const date = new Date(d);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return (
          <span className="text-muted-foreground text-sm">
            {mm}-{dd} {hh}:{min}
          </span>
        );
      },
    },
    {
      id: "qr",
      header: () => <QrCode className="h-4 w-4 text-muted-foreground" />,
      size: 50,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => options.onQrClick?.(row.original)}
          >
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ),
    },
    {
      id: "actions",
      size: 50,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  window.location.assign(`/products/${row.original.id}`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Засах
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => options.onDuplicate?.(row.original)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Хувилах
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => options.onDelete?.(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Устгах
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
