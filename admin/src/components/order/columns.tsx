"use client";

import { useState, useEffect, memo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Printer,
  Download,
  PackageSearch,
  Loader2,
} from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
} from "@/constants";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import type { OrderWithUser } from "./types";
import type {
  DeliveryStatus,
  PaymentStatus,
  PaymentMethod,
} from "@/types/database";
import { parseAsUTC } from "@/lib/utils/formatters";

// LRU-bounded cache for product images (shared across all tooltips).
// Without the cap an admin browsing hundreds of orders would grow
// this map unbounded and the parent page holds it for the whole
// session. 200 entries ≈ 200 orders' worth of rows.
const IMAGE_CACHE_MAX = 200;
const imageCache = new Map<string, { url: string; is_primary: boolean }[]>();
function imageCacheSet(key: string, value: { url: string; is_primary: boolean }[]) {
  if (imageCache.has(key)) imageCache.delete(key);
  imageCache.set(key, value);
  while (imageCache.size > IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value;
    if (oldest === undefined) break;
    imageCache.delete(oldest);
  }
}

const ProductHoverTooltip = memo(function ProductHoverTooltip({
  items,
}: {
  items: OrderWithUser["order_items"];
}) {
  const [hovered, setHovered] = useState(false);
  const [images, setImages] = useState<
    Map<string, { url: string; is_primary: boolean }[]>
  >(new Map());
  const [loading, setLoading] = useState(false);

  const productIds = items
    .map((item) =>
      item.products && "name" in item.products
        ? (item as { products: { name: string } }).products
        : null,
    )
    .filter(Boolean);

  // Fetch images when first hovered
  useEffect(() => {
    if (!hovered || loading || items.length === 0) return;

    // Collect product IDs that need fetching (not in cache)
    const itemProductIds = items.map((item) => item.id);
    const needsFetch = itemProductIds.some((id) => !imageCache.has(id));
    if (!needsFetch) {
      // All in cache
      const cached = new Map<string, { url: string; is_primary: boolean }[]>();
      for (const item of items) {
        const c = imageCache.get(item.id);
        if (c) cached.set(item.id, c);
      }
      setImages(cached);
      return;
    }

    setLoading(true);
    const orderItemIds = items.map((i) => i.id);
    adminApi
      .getAll<{
        id: string;
        products: {
          product_images: { url: string; is_primary: boolean }[];
        } | null;
      }>("order_items", {
        select: "id, products(product_images(url, is_primary))",
        filters: { "id.in": orderItemIds.join(",") },
      })
      .then((data) => {
        const result = new Map<
          string,
          { url: string; is_primary: boolean }[]
        >();
        for (const item of data) {
          const imgs = item.products?.product_images ?? [];
          imageCacheSet(item.id, imgs);
          result.set(item.id, imgs);
        }
        setImages(result);
      })
      .catch((err) => {
        // Previously swallowed silently; log so broken image joins
        // surface in observability instead of disappearing.
        log.warn("order_product_images_fetch_failed", {
          error: err instanceof Error ? err.message : String(err),
          itemCount: items.length,
        });
      })
      .finally(() => setLoading(false));
  }, [hovered, items, loading]);

  const productItems = [...items]
    .filter((item) => item.products?.name)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (productItems.length === 0)
    return <span className="text-muted-foreground">-</span>;

  const displayText = productItems
    .map((item) => `${item.products?.name} x${item.quantity}`)
    .join(", ");

  return (
    <div
      className="relative max-w-[320px] group/products"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
    >
      <div className="text-sm truncate">{displayText}</div>
      <div className="cursor-default absolute left-0 top-full z-50 hidden group-hover/products:block bg-popover border rounded-md shadow-md p-2 text-sm w-[320px] max-h-[280px] overflow-y-auto">
        <div className="space-y-2">
          {productItems.map((item) => {
            const itemImages = images.get(item.id) ?? [];
            const primaryImage = itemImages.find((img) => img.is_primary);
            const image = primaryImage || itemImages[0];
            return (
              <div key={item.id} className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {loading ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  ) : image ? (
                    <img
                      src={image.url}
                      alt={item.products?.name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm whitespace-normal line-clamp-1">
                    {item.products?.name}
                  </div>
                  {item.variant_name && (
                    <div className="text-xs text-muted-foreground">
                      {item.variant_name}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    x{item.quantity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Table meta type for passing update function
export interface OrderTableMeta {
  onUpdateDeliveryStatus?: (
    orderId: string,
    deliveryStatus: DeliveryStatus,
  ) => void;
  paymentStatusFilter?: string;
  selectedOrderIds?: Set<string>;
  onToggleOrder?: (orderId: string) => void;
  onToggleAllOrders?: (selected: boolean) => void;
}

// Helper function to get icon for delivery status
function getDeliveryStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "preparing":
      return <PackageSearch className="h-4 w-4 text-orange-600" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-slate-500" />;
    case "delivered":
      return <Package className="h-4 w-4 text-emerald-600" />;
    case "canceled":
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

// Helper function to get icon for payment status
function getPaymentStatusIcon(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return <Clock className="h-4 w-4 text-gray-600" />;
    case "processing":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "paid":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

// Payment status badge with icon (Төлбөр column)
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const label = PAYMENT_STATUS_LABELS[status];
  const icon = getPaymentStatusIcon(status);

  return (
    <Badge
      variant="secondary"
      className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
    >
      {icon}
      {label}
    </Badge>
  );
}

// Delivery status badge with icon (Хүргэлт column)
function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const label = DELIVERY_STATUS_LABELS[status];
  const icon = getDeliveryStatusIcon(status);

  return (
    <Badge
      variant="secondary"
      className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
    >
      {icon}
      {label}
    </Badge>
  );
}

// Wallet/bank-specific colors
const WALLET_COLORS: Record<string, string> = {
  socialpay: "bg-green-50 text-green-600",
  monpay: "bg-orange-50 text-orange-600",
  most: "bg-blue-50 text-blue-600",
  hipay: "bg-red-50 text-red-600",
  "m bank": "bg-purple-50 text-purple-600",
  "хаан": "bg-emerald-50 text-emerald-600",
  "голомт": "bg-sky-50 text-sky-600",
  "худалдаа хөгжлийн": "bg-amber-50 text-amber-600",
  "хас": "bg-teal-50 text-teal-600",
  "төрийн": "bg-indigo-50 text-indigo-600",
  "капитрон": "bg-pink-50 text-pink-600",
};

function getWalletColor(wallet: string): string {
  const key = wallet.toLowerCase();
  if (WALLET_COLORS[key]) return WALLET_COLORS[key];
  for (const [k, v] of Object.entries(WALLET_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-blue-50 text-blue-600";
}

// Short display names for wallets
const WALLET_SHORT_NAMES: Record<string, string> = {
  "худалдаа хөгжлийн банк": "Худалдаа хөгжил",
};

function formatWalletName(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower === "p2p") return "Данс";
  if (WALLET_SHORT_NAMES[lower]) return WALLET_SHORT_NAMES[lower];
  if (lower === "м банк" || lower === "m bank") return raw;
  return raw.replace(/\s*банк\s*/gi, "").trim() || raw;
}

// Payment method badge
function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const label = PAYMENT_METHOD_LABELS[method] || method;
  const colorClass =
    PAYMENT_METHOD_COLORS[method] || "bg-gray-100 text-gray-800";

  return (
    <Badge variant="secondary" className={`${colorClass} font-normal`}>
      {label}
    </Badge>
  );
}

// Format date as YYYY/MM/DD HH:mm
function formatDate(dateString: string): string {
  const date = parseAsUTC(dateString);
  const datePart = date
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, "/");
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
  return `${datePart} ${timePart}`;
}

// Format price with ₮ suffix
function formatPrice(amount: number): string {
  return `${amount.toLocaleString()}₮`;
}

export function getColumns(): ColumnDef<OrderWithUser>[] {
  return [
    // 0. Select checkbox (tracked by order ID, works across pages)
    {
      id: "select",
      header: ({ table }) => {
        const meta = table.options.meta as OrderTableMeta | undefined;
        const data = table.getRowModel().rows;
        const allSelected =
          data.length > 0 &&
          data.every((r) => meta?.selectedOrderIds?.has(r.original.id));
        const someSelected = data.some((r) =>
          meta?.selectedOrderIds?.has(r.original.id),
        );
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
    },
    // 1. Order Number
    {
      id: "order_id",
      header: "Дугаар",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.order_number ||
            row.original.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    // 2. Product Names (Бараа)
    {
      id: "products",
      header: "Бараа",
      size: 300,
      cell: ({ row }) => (
        <ProductHoverTooltip items={row.original.order_items || []} />
      ),
    },
    // 3. Төлбөр (Payment Status)
    {
      accessorKey: "payment_status",
      header: "Төлбөр",
      cell: ({ row }) => {
        return <PaymentStatusBadge status={row.original.payment_status} />;
      },
    },
    // 4. Хэрэглэгчийн нэр (Customer Name)
    {
      id: "customer_name",
      header: "Хэрэглэгчийн нэр",
      cell: ({ row }) => {
        const fullName = [
          row.original.users?.first_name,
          row.original.users?.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <span
            className="block max-w-[120px] truncate"
            title={fullName || row.original.users?.email || ""}
          >
            {fullName ||
              row.original.users?.email ||
              "Зочин#" + row.original.id.slice(0, 4).toUpperCase()}
          </span>
        );
      },
    },
    // 4. Т.Х (Payment Method)
    {
      id: "payment_method",
      header: "Т.Х",
      cell: ({ row }) => {
        const rawWallet = (row.original.payment_invoices ?? []).find(
          (inv) => inv.payment_wallet,
        )?.payment_wallet;
        const wallet = rawWallet ? formatWalletName(rawWallet) : undefined;
        // QPay: show wallet/bank name as colored badge
        if (row.original.payment_method === "qpay" && wallet) {
          return (
            <Badge
              variant="secondary"
              className={`${getWalletColor(rawWallet!)} font-normal`}
            >
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
    },
    // 5. Утас (Phone)
    {
      id: "phone",
      header: "Утас",
      cell: ({ row }) => (
        <span>{row.original.users?.primary_phone || "-"}</span>
      ),
    },
    // 6. Огноо (Date) - YYYY/MM/DD HH:mm format
    {
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
    },
    // 7. Нийт дүн (Total Amount)
    {
      accessorKey: "total_amount",
      header: "Нийт дүн",
      cell: ({ row }) => <span>{formatPrice(row.original.total_amount)}</span>,
    },
    // 8. Хүргэлт (Delivery Status) - editable dropdown
    {
      id: "delivery_status",
      header: "Хүргэлт",
      cell: ({ row, table }) => {
        const meta = table.options.meta as OrderTableMeta | undefined;
        const currentDeliveryStatus = row.original.delivery_status;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="cursor-pointer">
                <DeliveryStatusBadge status={currentDeliveryStatus} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {Object.entries(DELIVERY_STATUS_LABELS).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() =>
                    meta?.onUpdateDeliveryStatus?.(
                      row.original.id,
                      key as DeliveryStatus,
                    )
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
    },
    // 9. Print statuses (3 icons)
    {
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
    },
  ];
}
