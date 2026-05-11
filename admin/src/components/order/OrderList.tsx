"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type ExcelJS from "exceljs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  DataTableToolbar,
  DataTablePagination,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Download, Loader2, X, Printer, Package, RefreshCw } from "lucide-react";
import { OrderBoxPrintSheet, fetchImageBuffer } from "./OrderBoxPrint";
import { OrderStickerPrintSheet } from "./OrderStickerPrint";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/constants";
import { useOrderList } from "@/hooks/useOrderList";
import { getColumns, type OrderTableMeta } from "./columns";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DeliveryStatus } from "@/types/database";
import type { OrderWithUser } from "./types";
import { parseAsUTC } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderProductsTab } from "./OrderProductsTab";

function formatDateForExport(dateString: string): string {
  const date = parseAsUTC(dateString);
  return date
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, ".");
}

function formatDeliveryAddress(order: OrderWithUser): string {
  const parts = [order.delivery_city, order.delivery_district, order.delivery_sub_district, order.delivery_detail].filter(Boolean);
  return parts.join(", ") || "-";
}

const EXPORT_HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4CAF50" },
};

const EXPORT_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 10,
};

const EXPORT_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

const EXPORT_CENTER: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

const COL_COUNT = 12;

/**
 * Client-side sort to guarantee order matches the list page.
 * Parses orderBy strings like "paid_at.desc.nullslast,created_at.desc"
 */
function sortOrdersClientSide(orders: OrderWithUser[], orderBy: string): OrderWithUser[] {
  const clauses = orderBy.split(",").map((clause) => {
    const parts = clause.trim().split(".");
    return {
      column: parts[0] as keyof OrderWithUser,
      ascending: !parts.includes("desc"),
      nullsLast: parts.includes("nullslast"),
    };
  });

  return [...orders].sort((a, b) => {
    for (const { column, ascending, nullsLast } of clauses) {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal == null && bVal == null) continue;
      if (aVal == null) return nullsLast ? 1 : -1;
      if (bVal == null) return nullsLast ? -1 : 1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      if (cmp !== 0) return ascending ? cmp : -cmp;
    }
    return 0;
  });
}

const ORDERS_PER_EXPORT_FILE = 500;

async function exportOrdersToExcel(
  orders: OrderWithUser[],
  opts?: { fileIndex?: number; totalFiles?: number },
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Захиалга");

  ws.columns = [
    { width: 12 },  // A - Order date
    { width: 12 },  // B - Paid date
    { width: 12 },  // C - Order number
    { width: 10 },  // D - Image
    { width: 25 },  // E - Product name
    { width: 10 },  // F - Option
    { width: 6 },   // G - Qty
    { width: 10 },  // H - Price
    { width: 10 },  // I - Delivery price
    { width: 12 },  // J - Orderer name
    { width: 12 },  // K - Phone
    { width: 30 },  // L - Address
  ];

  ws.pageSetup = {
    paperSize: 9,            // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,          // no vertical constraint
  };

  const headers = [
    "Захиалга хийсэн өдөр",
    "Төлбөр төлсөн өдөр",
    "Захиалгын дугаар",
    "Бүтээгдэхүүний зураг",
    "Бүтээгдэхүүний нэр",
    "Сонголт",
    "Тоо",
    "Үнэ",
    "Хүргэлтийн үнэ",
    "Захиалга хийсэн хүний нэр",
    "Дугаар",
    "Хаяг",
  ];

  // Header row
  const headerRow = ws.getRow(1);
  headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
  headerRow.height = 30;
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= COL_COUNT) {
      cell.fill = EXPORT_HEADER_FILL;
      cell.font = EXPORT_HEADER_FONT;
      cell.border = EXPORT_BORDER;
      cell.alignment = EXPORT_CENTER;
    }
  });

  // Pre-fetch all unique product images
  const imageUrlSet = new Set<string>();
  for (const order of orders) {
    for (const item of order.order_items || []) {
      const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
      const image = primaryImage || item.products?.product_images?.[0];
      if (image?.url) imageUrlSet.add(image.url);
    }
  }

  const imageCache = new Map<string, number>();
  // Concurrency-limited fetch. The previous unbounded Promise.all
  // could fire 1000+ parallel image requests when exporting a large
  // order set — same shape as the production banner-storm incident.
  const urls = [...imageUrlSet];
  const CONCURRENCY = 10;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        const result = await fetchImageBuffer(url);
        if (result) {
          const imageId = workbook.addImage({
            buffer: result.buffer,
            extension: result.extension,
          });
          imageCache.set(url, imageId);
        }
      }
    }),
  );

  // Data rows
  let currentRow = 2;

  for (const order of orders) {
    const items = (order.order_items || []).filter((item) => item.products?.name).sort((a, b) => a.id.localeCompare(b.id));
    const rowCount = Math.max(items.length, 1);
    const startRow = currentRow;
    const endRow = currentRow + rowCount - 1;

    const orderDate = formatDateForExport(order.created_at);
    const paidDate = order.paid_at ? formatDateForExport(order.paid_at) : "-";
    const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
    const customerName = [order.users?.first_name, order.users?.last_name]
      .filter(Boolean)
      .join(" ") || "Зочин";
    const phone = order.users?.primary_phone || "-";
    const address = formatDeliveryAddress(order);

    // Write per-item rows
    for (let i = 0; i < rowCount; i++) {
      const row = ws.getRow(currentRow + i);
      row.height = 55;

      if (i === 0) {
        row.getCell(1).value = orderDate;       // A - Order date
        row.getCell(2).value = paidDate;        // B - Paid date
        row.getCell(3).value = orderNumber;     // C - Order number
        row.getCell(9).value = 7000;            // I - Delivery price
        row.getCell(10).value = customerName;   // J - Orderer name
        row.getCell(11).value = phone;          // K - Phone
        row.getCell(12).value = address;        // L - Address
      }

      const item = items[i];
      if (item) {
        row.getCell(4).value = "";                              // D - Image placeholder
        row.getCell(5).value = item.products?.name || "-";      // E - Product name
        row.getCell(6).value = item.variant_name || "-";        // F - Option
        row.getCell(7).value = item.quantity;                   // G - Qty
        row.getCell(8).value = item.price;                      // H - Price

        // Embed image
        const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
        const image = primaryImage || item.products?.product_images?.[0];
        if (image?.url && imageCache.has(image.url)) {
          const imageId = imageCache.get(image.url)!;
          ws.addImage(imageId, {
            tl: { col: 3.05, row: currentRow + i - 1 + 0.05 },
            ext: { width: 60, height: 60 },
            editAs: "oneCell",
          } as Parameters<typeof ws.addImage>[1]);
        }
      } else {
        row.getCell(4).value = "";
        row.getCell(5).value = "-";
        row.getCell(6).value = "-";
        row.getCell(7).value = 0;
        row.getCell(8).value = 0;
      }

      // Apply styling to all cells in the row
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= COL_COUNT) {
          cell.border = EXPORT_BORDER;
          cell.alignment = EXPORT_CENTER;
          cell.font = { size: 10 };
        }
      });
    }

    // Merge order-level cells vertically when there are multiple items
    if (rowCount > 1) {
      const mergeCols = [1, 2, 3, 9, 10, 11, 12]; // A, B, C, I, J, K, L
      for (const col of mergeCols) {
        ws.mergeCells(startRow, col, endRow, col);
      }
    }

    currentRow = endRow + 1;
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix =
    opts?.totalFiles && opts.totalFiles > 1
      ? `_хэсэг${opts.fileIndex! + 1}-${opts.totalFiles}`
      : "";
  a.download = `захиалга_${new Date().toISOString().split("T")[0]}${suffix}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Browser-side multi-file export. Splits an arbitrary-size order list
 * into N xlsx files each capped at ORDERS_PER_EXPORT_FILE rows. Sequential
 * awaits + brief delays let the browser handle each download gesture
 * without suppressing later ones.
 */
async function exportOrdersToExcelChunked(orders: OrderWithUser[]) {
  if (orders.length <= ORDERS_PER_EXPORT_FILE) {
    await exportOrdersToExcel(orders);
    return { fileCount: 1 };
  }
  const chunks: OrderWithUser[][] = [];
  for (let i = 0; i < orders.length; i += ORDERS_PER_EXPORT_FILE) {
    chunks.push(orders.slice(i, i + ORDERS_PER_EXPORT_FILE));
  }
  for (let i = 0; i < chunks.length; i++) {
    await exportOrdersToExcel(chunks[i], {
      fileIndex: i,
      totalFiles: chunks.length,
    });
    // Small gap so Chrome/Safari don't merge/suppress downloads.
    await new Promise((r) => setTimeout(r, 300));
  }
  return { fileCount: chunks.length };
}

export function OrderList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    filteredOrders,
    isLoading,
    isFetching,
    searchQuery,
    setSearchQuery,
    paymentFilter,
    setPaymentFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    sortOption,
    setSortOption,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
    setPageSize,
    dateFrom,
    dateTo,
    setDateRange,
    serverFilters,
    orderBy,
  } = useOrderList();

  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");

  const STORAGE_KEY = "admin:selectedOrderIds";
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist selection to sessionStorage
  useEffect(() => {
    if (selectedOrderIds.size > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedOrderIds]));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedOrderIds]);

  // Clear selection when filters change
  const filterKey = `${paymentFilter}|${paymentStatusFilter}|${dateFrom}|${dateTo}`;
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setSelectedOrderIds(new Set());
    }
  }, [filterKey]);
  const [isExporting, setIsExporting] = useState(false);
  const [boxPrintOpen, setBoxPrintOpen] = useState(false);
  const [boxPrintOrders, setBoxPrintOrders] = useState<OrderWithUser[]>([]);
  const [isBoxPrintLoading, setIsBoxPrintLoading] = useState(false);
  const [stickerPrintOpen, setStickerPrintOpen] = useState(false);
  const [stickerPrintOrders, setStickerPrintOrders] = useState<OrderWithUser[]>([]);
  const [isStickerLoading, setIsStickerLoading] = useState(false);

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: ({ orderId, deliveryStatus }: { orderId: string; deliveryStatus: DeliveryStatus }) =>
      adminApi.update("orders", orderId, {
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  const handleUpdateDeliveryStatus = useCallback(
    (orderId: string, deliveryStatus: DeliveryStatus) => {
      updateDeliveryStatusMutation.mutate({ orderId, deliveryStatus });
    },
    [updateDeliveryStatusMutation]
  );

  // Mark print status for selected orders
  const markStatusMutation = useMutation({
    mutationFn: ({ orderIds, field }: { orderIds: string[]; field: string }) =>
      Promise.all(
        orderIds.map((id) =>
          adminApi.update("orders", id, { [field]: true })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // 1. Бараа — box print (customer info + products per order sidebar)
  const handleBoxPrint = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    setIsBoxPrintLoading(true);
    try {
      const selected = await adminApi.getAll<OrderWithUser>("orders", {
        select:
          "id, user_id, order_number, status, delivery_status, total_amount, payment_status, payment_method, is_printed, created_at, paid_at, delivery_city, delivery_district, delivery_sub_district, delivery_detail, users(id, first_name, last_name, email, primary_phone), order_items(id, variant_name, quantity, warehouse_id, is_returned, products(name, product_images(url, is_primary))), payment_invoices(payment_wallet)",
        order: orderBy,
        filters: { "id.in": [...selectedOrderIds].join(",") },
      });
      setBoxPrintOrders(sortOrdersClientSide(selected, orderBy));
      setBoxPrintOpen(true);
    } finally {
      setIsBoxPrintLoading(false);
    }
  }, [selectedOrderIds, orderBy]);

  const handleBoxPrinted = useCallback((orderIds?: string[]) => {
    const ids = orderIds ?? [...selectedOrderIds];
    markStatusMutation.mutate({ orderIds: ids, field: "is_products_printed" });
  }, [markStatusMutation, selectedOrderIds]);

  // 2. Хайрцаг — sticker labels (CL426 paper)
  const handleStickerPrint = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    setIsStickerLoading(true);
    try {
      const selected = await adminApi.getAll<OrderWithUser>("orders", {
        select:
          "id, order_number, created_at, paid_at, delivery_city, delivery_district, delivery_sub_district, delivery_detail, users(first_name, last_name, primary_phone)",
        order: orderBy,
        filters: { "id.in": [...selectedOrderIds].join(",") },
      });
      setStickerPrintOrders(sortOrdersClientSide(selected, orderBy));
      setStickerPrintOpen(true);
    } finally {
      setIsStickerLoading(false);
    }
  }, [selectedOrderIds, orderBy]);

  const handleStickerPrinted = useCallback((orderIds: string[]) => {
    markStatusMutation.mutate({ orderIds, field: "is_box_printed" });
  }, [markStatusMutation]);

  // 3. Download (Татах) — exports Excel for selected orders. Large
  // selections are split into 500-row files so the browser doesn't
  // OOM assembling a multi-GB workbook.
  const handleDownload = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    setIsExporting(true);
    try {
      const selected = await adminApi.getAllBatched<OrderWithUser>("orders", {
        select:
          "id, user_id, order_number, status, delivery_status, total_amount, payment_status, payment_method, is_printed, created_at, paid_at, delivery_city, delivery_district, delivery_sub_district, delivery_detail, users(id, first_name, last_name, email, primary_phone), order_items(id, variant_name, quantity, price, products(name, product_images(url, is_primary))), payment_invoices(payment_wallet)",
        order: orderBy,
        filters: { "id.in": [...selectedOrderIds].join(",") },
      });
      const { fileCount } = await exportOrdersToExcelChunked(
        sortOrdersClientSide(selected, orderBy),
      );
      if (fileCount > 1) {
        toast.success(
          `Экспорт ${fileCount} файл болж хуваагдлаа (${ORDERS_PER_EXPORT_FILE} захиалга бүрт).`,
        );
      }
      markStatusMutation.mutate({ orderIds: [...selectedOrderIds], field: "is_downloaded" });
    } finally {
      setIsExporting(false);
    }
  }, [selectedOrderIds, orderBy, markStatusMutation]);

  const columns = useMemo(() => getColumns(), []);

  const handleToggleOrder = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const handleToggleAllOrders = useCallback(
    async (selected: boolean) => {
      if (!selected) {
        setSelectedOrderIds(new Set());
        return;
      }
      const allOrders = await adminApi.getAllBatched<{ id: string }>("orders", {
        select: "id",
        filters: serverFilters,
      });
      setSelectedOrderIds(new Set(allOrders.map((o) => o.id)));
    },
    [serverFilters],
  );

  const handleSelectAllOrders = useCallback(async () => {
    const allOrders = await adminApi.getAllBatched<{ id: string }>("orders", {
      select: "id",
      filters: serverFilters,
    });
    setSelectedOrderIds(new Set(allOrders.map((o) => o.id)));
  }, [serverFilters]);

  const handleDeselectAll = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  const selectedCount = selectedOrderIds.size;

  const tableMeta: OrderTableMeta = useMemo(
    () => ({
      onUpdateDeliveryStatus: handleUpdateDeliveryStatus,
      paymentStatusFilter,
      selectedOrderIds,
      onToggleOrder: handleToggleOrder,
      onToggleAllOrders: handleToggleAllOrders,
    }),
    [handleUpdateDeliveryStatus, paymentStatusFilter, selectedOrderIds, handleToggleOrder, handleToggleAllOrders]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Захиалга</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })}
          disabled={isFetching}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={cn("h-4 w-4 mr-1 transition-transform duration-500", isFetching && "animate-spin")} />
          Шинэчлэх
        </Button>
      </div>

      <div className="flex items-center justify-between border-b">
        <div className="flex">
          {([
            { value: "orders" as const, label: "Захиалга" },
            { value: "products" as const, label: selectedCount > 0 ? `Бараа (${selectedCount})` : "Бараа" },
          ]).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                activeTab === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
              )}
            </button>
          ))}
        </div>
        {selectedCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
            <X className="h-3 w-3 mr-1" />
            {selectedCount} сонгосон
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleSelectAllOrders}>
            Бүгд сонгох ({totalCount ?? filteredOrders.length})
          </Button>
        )}
      </div>

      {activeTab === "orders" ? (
      <>
      <div className="space-y-3">
        <DataTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Хайх"
          resultCount={totalCount ?? filteredOrders.length}
          resultLabel="захиалга"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Төрөл:</span>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Бүгд" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүгд</SelectItem>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Төлбөр:</span>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүгд</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Эрэмбэ:</span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Огноо ↓</SelectItem>
                <SelectItem value="date_asc">Огноо ↑</SelectItem>
                <SelectItem value="amount_desc">Дүн ↓</SelectItem>
                <SelectItem value="amount_asc">Дүн ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Огноо:</span>
            <div className="flex items-center gap-1">
              <DateRangePicker
                from={dateFrom ? new Date(dateFrom) : undefined}
                to={dateTo ? new Date(dateTo) : undefined}
                onChange={({ from, to }) => {
                  setDateRange(
                    from ? format(from, "yyyy-MM-dd") : "",
                    to ? format(to, "yyyy-MM-dd") : "",
                  );
                }}
                className="w-[280px]"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setDateRange("", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DataTableToolbar>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBoxPrint}
            disabled={selectedCount === 0 || isBoxPrintLoading}
          >
            {isBoxPrintLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-1" />
            )}
            Бараа{selectedCount > 0 && ` (${selectedCount})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStickerPrint}
            disabled={selectedCount === 0 || isStickerLoading}
          >
            {isStickerLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-1" />
            )}
            Хайрцаг{selectedCount > 0 && ` (${selectedCount})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={selectedCount === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Татах{selectedCount > 0 && ` (${selectedCount})`}
          </Button>
        </div>
      </div>

          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={isLoading}
            onRowClick={(row) => router.push(`/orders/${row.id}`)}
            emptyTitle="Захиалга байхгүй"
            emptyDescription="Захиалга ирээгүй байна"
            emptyIcon={ShoppingCart}
            meta={tableMeta}
          />

          <DataTablePagination
            pageIndex={page - 1}
            pageCount={totalPages}
            onPageChange={(p) => setPage(p + 1)}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
      </>
      ) : (
        <OrderProductsTab
          selectedOrderIds={selectedOrderIds}
          onPrinted={handleBoxPrinted}
        />
      )}
      <OrderBoxPrintSheet
        orders={boxPrintOrders}
        open={boxPrintOpen}
        onOpenChange={setBoxPrintOpen}
        onPrinted={handleBoxPrinted}
      />
      <OrderStickerPrintSheet
        orders={stickerPrintOrders}
        open={stickerPrintOpen}
        onOpenChange={setStickerPrintOpen}
        onPrinted={handleStickerPrinted}
      />
    </div>
  );
}
