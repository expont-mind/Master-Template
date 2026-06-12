"use client";

import { Download, Package, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DELIVERY_STATUS_LABELS } from "@/constants";

import {
  DeliveryStatusBadge,
  getDeliveryStatusIcon,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "./_badges";
import { formatDate, formatPrice, formatWalletName, getWalletColor } from "./_formatters";
import { ProductHoverTooltip } from "./_ProductHoverTooltip";

import type { OrderTableMeta, OrderWithUser } from "@/components/order/types";
import type { DeliveryStatus } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

export function selectColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "select",
    header: ({ table }) => {
      const meta = table.options.meta as OrderTableMeta | undefined;
      const data = table.getRowModel().rows;
      const allSelected =
        data.length > 0 && data.every((r) => meta?.selectedOrderIds?.has(r.original.id));
      const someSelected = data.some((r) => meta?.selectedOrderIds?.has(r.original.id));
      return (
        <Checkbox
          checked={allSelected || (someSelected && "indeterminate")}
          onCheckedChange={(value) => meta?.onToggleAllOrders?.(!!value)}
          className="size-5"
          aria-label="Бүгдийг сонгох"
        />
      );
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as OrderTableMeta | undefined;
      const checked = meta?.selectedOrderIds?.has(row.original.id) ?? false;
      return (
        <Checkbox
          checked={checked}
          onCheckedChange={() => meta?.onToggleOrder?.(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          className="size-5"
          aria-label="Сонгох"
        />
      );
    },
    size: 40,
  };
}

export function orderNumberColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "order_id",
    header: "Дугаар",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.order_number || row.original.id.slice(0, 8).toUpperCase()}
      </span>
    ),
  };
}

export function productsColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "products",
    header: "Бараа",
    size: 300,
    cell: ({ row }) => <ProductHoverTooltip items={row.original.order_items || []} />,
  };
}

export function paymentStatusColumn(): ColumnDef<OrderWithUser> {
  return {
    accessorKey: "payment_status",
    header: "Төлбөр",
    cell: ({ row }) => <PaymentStatusBadge status={row.original.payment_status} />,
  };
}

export function customerColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "customer_name",
    header: "Хэрэглэгчийн нэр",
    cell: ({ row }) => {
      const fullName = [row.original.users?.first_name, row.original.users?.last_name]
        .filter(Boolean)
        .join(" ");
      const displayName =
        fullName ||
        row.original.users?.email ||
        "Зочин#" + row.original.id.slice(0, 4).toUpperCase();
      return (
        <span
          className="block max-w-[120px] truncate"
          title={fullName || row.original.users?.email || ""}
        >
          {displayName}
        </span>
      );
    },
  };
}

export function paymentMethodColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "payment_method",
    header: "Т.Х",
    cell: ({ row }) => {
      const rawWallet = (row.original.payment_invoices ?? []).find(
        (inv) => inv.payment_wallet,
      )?.payment_wallet;
      const wallet = rawWallet ? formatWalletName(rawWallet) : undefined;
      if (row.original.payment_method === "qpay" && wallet) {
        return (
          <Badge variant="secondary" className={`${getWalletColor(rawWallet!)} font-normal`}>
            {wallet}
          </Badge>
        );
      }
      return (
        <div className="flex flex-col gap-0.5 max-w-[100px]">
          <PaymentMethodBadge method={row.original.payment_method} />
        </div>
      );
    },
  };
}

export function phoneColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "phone",
    header: "Утас",
    cell: ({ row }) => <span>{row.original.users?.primary_phone || "-"}</span>,
  };
}

export function dateColumn(): ColumnDef<OrderWithUser> {
  return {
    accessorKey: "paid_at",
    header: "Огноо",
    cell: ({ row, table }) => {
      const meta = table.options.meta as OrderTableMeta | undefined;
      const usePayDate = meta?.paymentStatusFilter === "paid";
      const dateStr = usePayDate
        ? row.original.paid_at || row.original.created_at
        : row.original.created_at;
      return <span>{formatDate(dateStr)}</span>;
    },
  };
}

export function totalColumn(): ColumnDef<OrderWithUser> {
  return {
    accessorKey: "total_amount",
    header: "Нийт дүн",
    cell: ({ row }) => <span>{formatPrice(row.original.total_amount)}</span>,
  };
}

export function deliveryColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "delivery_status",
    header: "Хүргэлт",
    cell: ({ row, table }) => {
      const meta = table.options.meta as OrderTableMeta | undefined;
      const currentDeliveryStatus = row.original.delivery_status;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cursor-pointer">
              <DeliveryStatusBadge status={currentDeliveryStatus} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            {Object.entries(DELIVERY_STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() =>
                  meta?.onUpdateDeliveryStatus?.(row.original.id, key as DeliveryStatus)
                }
                className={`flex items-center gap-2 ${currentDeliveryStatus === key ? "bg-muted" : ""}`}
              >
                {getDeliveryStatusIcon(key as DeliveryStatus)}
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}

export function printStatusColumn(): ColumnDef<OrderWithUser> {
  return {
    id: "print_status",
    header: "Хэвлэлт",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Package
          className={`h-3.5 w-3.5 ${row.original.is_products_printed ? "text-emerald-600" : "text-muted-foreground/30"}`}
        />
        <Printer
          className={`h-3.5 w-3.5 ${row.original.is_box_printed ? "text-emerald-600" : "text-muted-foreground/30"}`}
        />
        <Download
          className={`h-3.5 w-3.5 ${row.original.is_downloaded ? "text-emerald-600" : "text-muted-foreground/30"}`}
        />
      </div>
    ),
  };
}
