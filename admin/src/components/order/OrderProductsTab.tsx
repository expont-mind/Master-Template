"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type ExcelJS from "exceljs";
import { Package, Printer, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchImageBuffer } from "./OrderBoxPrint";
import { adminApi } from "@/lib/admin-api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DataTablePagination } from "@/components/ui/data-table";
import type { OrderWithUser } from "./types";

interface OrderProductsTabProps {
  selectedOrderIds: Set<string>;
  onPrinted?: () => void;
}

interface VariantInfo {
  variantName: string | null;
  quantity: number;
  orderNumbers: string[];
}

interface GroupedProduct {
  productName: string;
  imageUrl: string | null;
  totalQuantity: number;
  variants: VariantInfo[];
  orderNumbers: string[];
}

const DEFAULT_pageSize = 100;

function ProductsPrintTable({ groups }: { groups: GroupedProduct[] }) {
  let rowNum = 0;
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["#", "ЗУРАГ", "БҮТЭЭГДЭХҮҮНИЙ НЭР", "СОНГОЛТ", "ТОО"].map((label) => (
            <th
              key={label}
              className="bg-[#3d6b7e] text-white font-bold text-center p-3 border-2 border-[#2d5060] print:bg-gray-100 print:text-black print:border-gray-400 text-xs"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          rowNum++;
          const hasVariants = group.variants.length > 1 || (group.variants.length === 1 && group.variants[0].variantName);
          return hasVariants ? (
            <>
              {group.variants.map((v, vi) => (
                <tr key={`${group.productName}-${v.variantName}-${vi}`}>
                  {vi === 0 && (
                    <>
                      <td rowSpan={group.variants.length} className="p-2 border border-gray-300 text-center align-middle text-sm w-10">
                        {rowNum}
                      </td>
                      <td rowSpan={group.variants.length} className="p-2 border border-gray-300 text-center align-middle">
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt="" className="w-12 h-12 object-contain mx-auto print:w-10 print:h-10" />
                        ) : "-"}
                      </td>
                      <td rowSpan={group.variants.length} className="p-2 border border-gray-300 text-left align-middle text-sm">
                        {group.productName}
                      </td>
                    </>
                  )}
                  <td className="p-2 border border-gray-300 text-center align-middle text-sm">
                    {v.variantName || "-"}
                  </td>
                  <td className="p-2 border border-gray-300 text-center align-middle text-sm font-semibold">
                    {v.quantity}
                  </td>
                </tr>
              ))}
            </>
          ) : (
            <tr key={group.productName}>
              <td className="p-2 border border-gray-300 text-center align-middle text-sm w-10">{rowNum}</td>
              <td className="p-2 border border-gray-300 text-center align-middle">
                {group.imageUrl ? (
                  <img src={group.imageUrl} alt="" className="w-12 h-12 object-contain mx-auto print:w-10 print:h-10" />
                ) : "-"}
              </td>
              <td className="p-2 border border-gray-300 text-left align-middle text-sm">{group.productName}</td>
              <td className="p-2 border border-gray-300 text-center align-middle text-sm">-</td>
              <td className="p-2 border border-gray-300 text-center align-middle text-sm font-semibold">{group.totalQuantity}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function OrderProductsTab({ selectedOrderIds, onPrinted }: OrderProductsTabProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_pageSize);
  const [searchQuery, setSearchQuery] = useState("");
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const hasSelection = selectedOrderIds.size > 0;

  // Stable key for React Query based on selected IDs
  const selectedIdsKey = useMemo(
    () => [...selectedOrderIds].sort().join(","),
    [selectedOrderIds],
  );

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "products-tab-selected", selectedIdsKey],
    queryFn: async () => {
      const ids = [...selectedOrderIds];
      if (ids.length === 0) return [];
      // Batch fetch by IDs to avoid URL length limits
      const BATCH_SIZE = 100;
      const results: OrderWithUser[] = [];
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        const batch = await adminApi.getAll<OrderWithUser>("orders", {
          select:
            "id, order_number, order_items(id, variant_name, quantity, is_returned, products(name, product_images(url, is_primary)))",
          filters: { "id.in": batchIds.join(",") },
        });
        results.push(...batch);
      }
      return results;
    },
    enabled: hasSelection,
    staleTime: 60_000,
  });

  // Group by product name, then aggregate variants within each product
  const grouped = useMemo(() => {
    const productMap = new Map<string, {
      imageUrl: string | null;
      variants: Map<string, { quantity: number; orderNumbers: Set<string> }>;
      allOrderNumbers: Set<string>;
    }>();

    for (const order of orders) {
      const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();
      for (const item of order.order_items || []) {
        if (item.is_returned) continue;
        const productName = item.products?.name || "Unknown";
        const variantKey = item.variant_name || "";

        let product = productMap.get(productName);
        if (!product) {
          const primaryImg = item.products?.product_images?.find((img: { is_primary: boolean }) => img.is_primary);
          const firstImg = item.products?.product_images?.[0];
          product = {
            imageUrl: (primaryImg || firstImg)?.url || null,
            variants: new Map(),
            allOrderNumbers: new Set(),
          };
          productMap.set(productName, product);
        }

        product.allOrderNumbers.add(orderNum);

        const variant = product.variants.get(variantKey);
        if (variant) {
          variant.quantity += item.quantity;
          variant.orderNumbers.add(orderNum);
        } else {
          product.variants.set(variantKey, {
            quantity: item.quantity,
            orderNumbers: new Set([orderNum]),
          });
        }
      }
    }

    const result: GroupedProduct[] = [];
    for (const [productName, product] of productMap) {
      const variants: VariantInfo[] = [];
      let totalQuantity = 0;
      for (const [variantName, v] of product.variants) {
        variants.push({
          variantName: variantName || null,
          quantity: v.quantity,
          orderNumbers: [...v.orderNumbers],
        });
        totalQuantity += v.quantity;
      }
      variants.sort((a, b) => b.quantity - a.quantity);
      result.push({
        productName,
        imageUrl: product.imageUrl,
        totalQuantity,
        variants,
        orderNumbers: [...product.allOrderNumbers],
      });
    }

    result.sort((a, b) => a.productName.localeCompare(b.productName));
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter((g) =>
      g.productName.toLowerCase().includes(q) ||
      g.variants.some((v) => v.variantName?.toLowerCase().includes(q))
    );
  }, [grouped, searchQuery]);

  const totalProductCount = filtered.length;
  const totalItems = filtered.reduce((sum, g) => sum + g.totalQuantity, 0);
  const pageCount = Math.ceil(totalProductCount / pageSize);
  const paginatedGroups = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Бараа жагсаалт");

      const headerFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4CAF50" } };
      const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      const border: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
      const center: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle", wrapText: true };

      ws.columns = [
        { width: 6 },   // A - #
        { width: 10 },  // B - Image
        { width: 30 },  // C - Product name
        { width: 15 },  // D - Variant
        { width: 8 },   // E - Qty
      ];

      ws.pageSetup = { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

      const COL_COUNT = 5;
      const headers = ["#", "Зураг", "Бүтээгдэхүүний нэр", "Сонголт", "Тоо"];
      const headerRow = ws.getRow(1);
      headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
      headerRow.height = 28;
      headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col <= COL_COUNT) {
          cell.fill = headerFill;
          cell.font = headerFont;
          cell.border = border;
          cell.alignment = center;
        }
      });

      // Pre-fetch images
      const imageUrlSet = new Set<string>();
      for (const g of filtered) {
        if (g.imageUrl) imageUrlSet.add(g.imageUrl);
      }
      const imageCache = new Map<string, number>();
      await Promise.all(
        [...imageUrlSet].map(async (url) => {
          const result = await fetchImageBuffer(url);
          if (result) {
            const imageId = workbook.addImage({ buffer: result.buffer, extension: result.extension });
            imageCache.set(url, imageId);
          }
        })
      );

      let currentRow = 2;
      for (let i = 0; i < filtered.length; i++) {
        const g = filtered[i];
        const hasVariants = g.variants.length > 1 || (g.variants.length === 1 && g.variants[0].variantName);
        const rowCount = hasVariants ? g.variants.length : 1;
        const startRow = currentRow;

        for (let vi = 0; vi < rowCount; vi++) {
          const row = ws.getRow(currentRow);
          row.height = 50;

          if (vi === 0) {
            row.getCell(1).value = i + 1;
            row.getCell(2).value = "";
            row.getCell(3).value = g.productName;

            if (g.imageUrl && imageCache.has(g.imageUrl)) {
              ws.addImage(imageCache.get(g.imageUrl)!, {
                tl: { col: 1.05, row: currentRow - 1 + 0.05 },
                ext: { width: 60, height: 60 },
                editAs: "oneCell",
              } as Parameters<typeof ws.addImage>[1]);
            }
          }

          if (hasVariants) {
            const v = g.variants[vi];
            row.getCell(4).value = v.variantName || "-";
            row.getCell(5).value = v.quantity;
          } else {
            row.getCell(4).value = "-";
            row.getCell(5).value = g.totalQuantity;
          }

          row.eachCell({ includeEmpty: true }, (cell, col) => {
            if (col <= COL_COUNT) {
              cell.border = border;
              cell.alignment = center;
              cell.font = { size: 10 };
            }
          });

          currentRow++;
        }

        if (rowCount > 1) {
          ws.mergeCells(startRow, 1, startRow + rowCount - 1, 1);
          ws.mergeCells(startRow, 2, startRow + rowCount - 1, 2);
          ws.mergeCells(startRow, 3, startRow + rowCount - 1, 3);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `бараа_жагсаалт_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-10 w-10 mb-2" />
        <p className="text-sm font-medium">Бараа байхгүй</p>
        <p className="text-xs">Захиалга сонгоно уу</p>
      </div>
    );
  }

  return (
    <>
      {printSheetOpen && (
        <style>{`
          @media print {
            body > *:not([data-slot="sheet-overlay"]):not(:has([data-print-content])) {
              display: none !important;
            }
            [data-slot="sheet-overlay"] {
              display: none !important;
            }
            [data-slot="sheet-content"] {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              animation: none !important;
            }
            [data-slot="sheet-header"] {
              display: none !important;
            }
            [data-slot="sheet-close"] {
              display: none !important;
            }
            [data-print-content] {
              overflow: visible !important;
              padding: 0 !important;
            }
          }
        `}</style>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 gap-3">
          <div className="relative w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Бараа хайх..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="pl-8 h-8"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {totalProductCount} бараа · {totalItems} ширхэг · {orders.length} захиалга
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintSheetOpen(true)}>
              <Printer className="h-4 w-4 mr-2" />
              Хэвлэх
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Татах
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-3 py-2 text-center text-sm font-medium">#</th>
                <th className="w-14 px-3 py-2" />
                <th className="text-left px-3 py-2 text-sm font-medium">Бараа</th>
                <th className="text-right px-3 py-2 text-sm font-medium w-20">Тоо</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.map((group, idx) => {
                const hasVariants = group.variants.length > 1 || (group.variants.length === 1 && group.variants[0].variantName);
                return (
                  <tr
                    key={group.productName}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-sm text-muted-foreground align-top">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium">{group.productName}</div>
                      {hasVariants && (
                        <div className="mt-1 space-y-0.5">
                          {group.variants.map((v, vi) => (
                            <div key={vi} className="flex items-center justify-between text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                              <span>{v.variantName || "-"}</span>
                              <span className="font-medium text-foreground">{v.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <span className="text-sm font-semibold">{group.totalQuantity}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalProductCount > 0 && (
          <DataTablePagination
            pageIndex={page}
            pageCount={pageCount}
            onPageChange={setPage}
            totalCount={totalProductCount}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
          />
        )}
      </div>

      <Sheet open={printSheetOpen} onOpenChange={setPrintSheetOpen}>
        <SheetContent side="right" className="sm:max-w-4xl w-full overflow-hidden flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <div>
              <SheetTitle>Бараа жагсаалт</SheetTitle>
              <SheetDescription>
                {totalProductCount} бараа · {totalItems} ширхэг · {orders.length} захиалга
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Татах
              </Button>
              <Button size="sm" onClick={() => { window.print(); onPrinted?.(); }}>
                <Printer className="h-4 w-4 mr-2" />
                Хэвлэх
              </Button>
            </div>
          </SheetHeader>
          <div
            data-print-content
            className="flex-1 overflow-y-auto px-4 pb-4"
          >
            <ProductsPrintTable groups={filtered} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
