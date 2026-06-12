"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";

import {
  buildProductExportFilters,
  EXPORT_FILE_CAP,
  exportProductsToExcel,
} from "./_productsExcelExport";

import type { Product } from "./types";

interface ExportFilters {
  searchQuery: string;
  statusFilter: string;
  stockFilter: string;
  discountFilter: string;
  categoryFilter: string;
  brandFilter: string;
  dateFrom: string;
  dateTo: string;
}

export function useProductExport(filters: ExportFilters) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const serverFilters = buildProductExportFilters(filters);
      const allProducts = await adminApi.getAllBatched<Product>("products", {
        select: `id, name, price, discount_price, stock_quantity, status, original_url, created_at, brands(id, name), product_categories(category_id, categories(id, name))`,
        order: "created_at.desc",
        filters: serverFilters,
      });
      const { fileCount } = await exportProductsToExcel(allProducts);
      if (fileCount > 1) {
        toast.success(
          `Экспорт ${fileCount} файл болж хуваагдлаа (${EXPORT_FILE_CAP} бүтээгдэхүүн бүрт).`,
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  return { isExporting, handleExport };
}
