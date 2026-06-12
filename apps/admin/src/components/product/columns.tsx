"use client";

import { MoreVertical, Pencil, Copy, Trash2, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageCell, PriceCell } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRODUCT_STATUS_LABELS } from "@/constants";

import type { Product } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  draft: "bg-yellow-100 text-yellow-800",
};

function selectColumn(): ColumnDef<Product> {
  return {
    id: "select",
    header: ({ table }) => (
      <div className="pl-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Бүгдийг сонгох"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="pl-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Мөр сонгох"
        />
      </div>
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  };
}

function imageColumn(): ColumnDef<Product> {
  return {
    id: "image",
    header: "Зураг",
    size: 72,
    cell: ({ row }) => {
      const primaryImage = row.original.product_images?.find((img) => img.is_primary);
      return <ImageCell src={primaryImage?.url} alt={row.original.name} />;
    },
  };
}

function nameColumn(): ColumnDef<Product> {
  return {
    accessorKey: "name",
    header: "Нэр",
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <p className="font-medium">{row.original.name}</p>
      </div>
    ),
  };
}

function PriceCellContents({ product }: { product: Product }) {
  const variants = product.product_variants;
  const defaultVariant =
    variants?.find((v) => v.is_default && v.status === "active") ??
    variants?.find((v) => v.status === "active");
  const price = defaultVariant?.price ?? product.price;
  const discount = defaultVariant?.discount_price ?? product.discount_price;
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
}

function priceColumn(): ColumnDef<Product> {
  return {
    id: "price",
    header: "Үнэ",
    size: 140,
    cell: ({ row }) => <PriceCellContents product={row.original} />,
  };
}

function statusColumn(): ColumnDef<Product> {
  return {
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
  };
}

function categoryColumn(): ColumnDef<Product> {
  return {
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
            <Badge key={pc.category_id} variant="secondary" className="bg-gray-100 text-gray-700">
              {pc.categories?.name ?? "—"}
            </Badge>
          ))}
        </div>
      );
    },
  };
}

function stockColumn(): ColumnDef<Product> {
  return {
    id: "stock",
    header: "Тоо",
    size: 80,
    cell: ({ row }) => {
      const variants = row.original.product_variants;
      const activeVariants = variants?.filter((v) => v.status === "active");
      const stock =
        activeVariants && activeVariants.length > 1
          ? activeVariants.reduce((sum, v) => sum + v.stock_quantity, 0)
          : (row.original.stock_quantity ?? 0);
      return <span className="text-muted-foreground">{stock}</span>;
    },
  };
}

function createdAtColumn(): ColumnDef<Product> {
  return {
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
  };
}

function qrColumn(onQrClick?: (product: Product) => void): ColumnDef<Product> {
  return {
    id: "qr",
    header: () => <QrCode className="h-4 w-4 text-muted-foreground" />,
    size: 50,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          onQrClick?.(row.original);
        }}
      >
        <QrCode className="h-4 w-4 text-muted-foreground" />
      </Button>
    ),
  };
}

function actionsColumn(opts: {
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
}): ColumnDef<Product> {
  return {
    id: "actions",
    size: 50,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.location.assign(`/products/${row.original.id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Засах
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => opts.onDuplicate?.(row.original)}>
            <Copy className="mr-2 h-4 w-4" />
            Хувилах
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => opts.onDelete?.(row.original)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Устгах
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  };
}

export function getColumns(options: {
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onQrClick?: (product: Product) => void;
}): ColumnDef<Product>[] {
  return [
    selectColumn(),
    imageColumn(),
    nameColumn(),
    priceColumn(),
    statusColumn(),
    categoryColumn(),
    stockColumn(),
    createdAtColumn(),
    qrColumn(options.onQrClick),
    actionsColumn({ onDelete: options.onDelete, onDuplicate: options.onDuplicate }),
  ];
}
