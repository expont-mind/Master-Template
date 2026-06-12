import { PRODUCT_STATUS_LABELS } from "@/constants";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { Product } from "./types";

const PRODUCTS_PER_EXPORT_FILE = 500;
export const EXPORT_FILE_CAP = PRODUCTS_PER_EXPORT_FILE;

function formatDateForExport(dateString: string): string {
  const date = parseAsUTC(dateString);
  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

const HEADERS = [
  "№",
  "Нэр",
  "Брэнд",
  "Ангилал",
  "Үнэ",
  "Хямдралын үнэ",
  "Нөөц",
  "Төлөв",
  "Эх линк",
  "Үүсгэсэн огноо",
];

const COL_WIDTHS = [
  { wch: 5 },
  { wch: 40 },
  { wch: 20 },
  { wch: 25 },
  { wch: 12 },
  { wch: 12 },
  { wch: 8 },
  { wch: 12 },
  { wch: 50 },
  { wch: 20 },
];

async function writeChunk(products: Product[], startIdx: number, suffix: string): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = products.map((product, idx) => {
    const categories = (product.product_categories || [])
      .map((pc) => pc.categories?.name)
      .filter(Boolean)
      .join(", ");

    return [
      startIdx + idx + 1,
      product.name,
      product.brands?.name || "-",
      categories || "-",
      product.price,
      product.discount_price ?? "-",
      product.stock_quantity ?? "-",
      PRODUCT_STATUS_LABELS[product.status] || product.status,
      product.original_url || "-",
      formatDateForExport(product.created_at),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = COL_WIDTHS;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Бүтээгдэхүүн");
  XLSX.writeFile(wb, `бүтээгдэхүүн_${new Date().toISOString().split("T")[0]}${suffix}.xlsx`);
}

/**
 * Browser-side Excel export. Splits large product sets into N files capped
 * at PRODUCTS_PER_EXPORT_FILE rows. Sequential awaits + brief delays let
 * the browser handle each download without suppressing later ones.
 */
export async function exportProductsToExcel(products: Product[]): Promise<{ fileCount: number }> {
  if (products.length <= PRODUCTS_PER_EXPORT_FILE) {
    await writeChunk(products, 0, "");
    return { fileCount: 1 };
  }
  const chunks: Product[][] = [];
  for (let i = 0; i < products.length; i += PRODUCTS_PER_EXPORT_FILE) {
    chunks.push(products.slice(i, i + PRODUCTS_PER_EXPORT_FILE));
  }
  for (let i = 0; i < chunks.length; i++) {
    await writeChunk(chunks[i], i * PRODUCTS_PER_EXPORT_FILE, `_хэсэг${i + 1}-${chunks.length}`);
    await new Promise((r) => setTimeout(r, 300));
  }
  return { fileCount: chunks.length };
}

/**
 * Build the PostgREST filter object the export uses, mirroring the live
 * list filters so the user gets exactly what they're seeing on screen.
 */
export function buildProductExportFilters(input: {
  searchQuery: string;
  statusFilter: string;
  stockFilter: string;
  discountFilter: string;
  categoryFilter: string;
  brandFilter: string;
  dateFrom: string;
  dateTo: string;
}): Record<string, string> {
  const filters: Record<string, string> = {};
  if (input.searchQuery.trim()) filters["search_words"] = input.searchQuery.trim();
  if (input.statusFilter !== "all") filters["status.eq"] = input.statusFilter;
  if (input.stockFilter === "out") filters["stock_quantity.eq"] = "0";
  if (input.stockFilter === "low") {
    filters["stock_quantity.lt"] = "10";
    filters["stock_quantity.gt"] = "0";
  }
  if (input.stockFilter === "in_stock") filters["stock_quantity.gte"] = "10";
  if (input.discountFilter === "has") filters["discount_price.gt"] = "0";
  if (input.discountFilter === "none") filters["discount_price.is"] = "null";
  if (input.categoryFilter !== "all") filters["category_id"] = input.categoryFilter;
  if (input.brandFilter !== "all") filters["brand_id.eq"] = input.brandFilter;
  if (input.dateFrom) {
    filters["created_at.gte"] = new Date(`${input.dateFrom}T00:00:00`).toISOString();
  }
  if (input.dateTo) {
    filters["created_at.lte"] = new Date(`${input.dateTo}T23:59:59`).toISOString();
  }
  return filters;
}
