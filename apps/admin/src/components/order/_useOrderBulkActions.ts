"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { EXPORT_FILE_CAP, exportOrdersToExcelChunked } from "./_excelExport";
import { sortOrdersClientSide } from "./_sortOrders";

import type { OrderWithUser } from "./types";

interface UseOrderBulkActionsArgs {
  selectedOrderIds: Set<string>;
  selectedCount: number;
  orderBy: string;
}

/**
 * Holds box-print, sticker-print and download (excel export) flows
 * that operate on the current selection.
 */
export function useOrderBulkActions({
  selectedOrderIds,
  selectedCount,
  orderBy,
}: UseOrderBulkActionsArgs) {
  const queryClient = useQueryClient();

  const [isExporting, setIsExporting] = useState(false);
  const [boxPrintOpen, setBoxPrintOpen] = useState(false);
  const [boxPrintOrders, setBoxPrintOrders] = useState<OrderWithUser[]>([]);
  const [isBoxPrintLoading, setIsBoxPrintLoading] = useState(false);
  const [stickerPrintOpen, setStickerPrintOpen] = useState(false);
  const [stickerPrintOrders, setStickerPrintOrders] = useState<OrderWithUser[]>([]);
  const [isStickerLoading, setIsStickerLoading] = useState(false);

  const markStatusMutation = useMutation({
    mutationFn: ({ orderIds, field }: { orderIds: string[]; field: string }) =>
      Promise.all(orderIds.map((id) => adminApi.update("orders", id, { [field]: true }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  const handleBoxPrint = useCallback(async () => {
    if (selectedCount === 0) return;
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
  }, [selectedCount, selectedOrderIds, orderBy]);

  const handleBoxPrinted = useCallback(
    (orderIds?: string[]) => {
      const ids = orderIds ?? [...selectedOrderIds];
      markStatusMutation.mutate({
        orderIds: ids,
        field: "is_products_printed",
      });
    },
    [markStatusMutation, selectedOrderIds],
  );

  const handleStickerPrint = useCallback(async () => {
    if (selectedCount === 0) return;
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
  }, [selectedCount, selectedOrderIds, orderBy]);

  const handleStickerPrinted = useCallback(
    (orderIds: string[]) => {
      markStatusMutation.mutate({ orderIds, field: "is_box_printed" });
    },
    [markStatusMutation],
  );

  const handleDownload = useCallback(async () => {
    if (selectedCount === 0) return;
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
          `Экспорт ${fileCount} файл болж хуваагдлаа (${EXPORT_FILE_CAP} захиалга бүрт).`,
        );
      }
      markStatusMutation.mutate({
        orderIds: [...selectedOrderIds],
        field: "is_downloaded",
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedCount, selectedOrderIds, orderBy, markStatusMutation]);

  return {
    // export
    isExporting,
    handleDownload,
    // box print
    boxPrintOpen,
    setBoxPrintOpen,
    boxPrintOrders,
    isBoxPrintLoading,
    handleBoxPrint,
    handleBoxPrinted,
    // sticker print
    stickerPrintOpen,
    setStickerPrintOpen,
    stickerPrintOrders,
    isStickerLoading,
    handleStickerPrint,
    handleStickerPrinted,
  };
}
