import { parseAsUTC } from "@/lib/utils/formatters";

import { fetchImageBuffer } from "./OrderBoxPrint";

import type { OrderWithUser } from "./types";
import type ExcelJS from "exceljs";

// ── Style constants ────────────────────────────────────────────

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
const ORDERS_PER_EXPORT_FILE = 500;

export const EXPORT_FILE_CAP = ORDERS_PER_EXPORT_FILE;

// ── Helpers ────────────────────────────────────────────────────

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
  const parts = [
    order.delivery_city,
    order.delivery_district,
    order.delivery_sub_district,
    order.delivery_detail,
  ].filter(Boolean);
  return parts.join(", ") || "-";
}

function configureWorksheet(ws: ExcelJS.Worksheet, headers: string[]) {
  ws.columns = [
    { width: 12 }, // A - Order date
    { width: 12 }, // B - Paid date
    { width: 12 }, // C - Order number
    { width: 10 }, // D - Image
    { width: 25 }, // E - Product name
    { width: 10 }, // F - Option
    { width: 6 }, // G - Qty
    { width: 10 }, // H - Price
    { width: 10 }, // I - Delivery price
    { width: 12 }, // J - Orderer name
    { width: 12 }, // K - Phone
    { width: 30 }, // L - Address
  ];
  ws.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  const headerRow = ws.getRow(1);
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
  });
  headerRow.height = 30;
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= COL_COUNT) {
      cell.fill = EXPORT_HEADER_FILL;
      cell.font = EXPORT_HEADER_FONT;
      cell.border = EXPORT_BORDER;
      cell.alignment = EXPORT_CENTER;
    }
  });
}

/**
 * Concurrency-limited fetch + workbook.addImage for every unique product
 * image in the order set. The previous unbounded Promise.all could fire
 * 1000+ parallel image requests when exporting a large order set — same
 * shape as the production banner-storm incident.
 */
async function prefetchImages(
  orders: OrderWithUser[],
  workbook: ExcelJS.Workbook,
): Promise<Map<string, number>> {
  const imageUrlSet = new Set<string>();
  for (const order of orders) {
    for (const item of order.order_items || []) {
      const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
      const image = primaryImage || item.products?.product_images?.[0];
      if (image?.url) imageUrlSet.add(image.url);
    }
  }
  const imageCache = new Map<string, number>();
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
  return imageCache;
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= COL_COUNT) {
      cell.border = EXPORT_BORDER;
      cell.alignment = EXPORT_CENTER;
      cell.font = { size: 10 };
    }
  });
}

function writeOrderHeaderCells(row: ExcelJS.Row, order: OrderWithUser): void {
  row.getCell(1).value = formatDateForExport(order.created_at);
  row.getCell(2).value = order.paid_at ? formatDateForExport(order.paid_at) : "-";
  row.getCell(3).value = order.order_number || order.id.slice(0, 8).toUpperCase();
  row.getCell(9).value = 7000;
  row.getCell(10).value =
    [order.users?.first_name, order.users?.last_name].filter(Boolean).join(" ") || "Зочин";
  row.getCell(11).value = order.users?.primary_phone || "-";
  row.getCell(12).value = formatDeliveryAddress(order);
}

function resolveItemImageId(
  item: NonNullable<OrderWithUser["order_items"]>[number],
  imageCache: Map<string, number>,
): number | null {
  const images = item.products?.product_images ?? [];
  const image = images.find((img) => img.is_primary) ?? images[0];
  if (!image?.url) return null;
  return imageCache.get(image.url) ?? null;
}

function writeItemCells(
  row: ExcelJS.Row,
  ws: ExcelJS.Worksheet,
  item: NonNullable<OrderWithUser["order_items"]>[number] | undefined,
  rowIndex: number,
  imageCache: Map<string, number>,
): void {
  if (!item) {
    row.getCell(4).value = "";
    row.getCell(5).value = "-";
    row.getCell(6).value = "-";
    row.getCell(7).value = 0;
    row.getCell(8).value = 0;
    return;
  }
  row.getCell(4).value = "";
  row.getCell(5).value = item.products?.name ?? "-";
  row.getCell(6).value = item.variant_name ?? "-";
  row.getCell(7).value = item.quantity;
  row.getCell(8).value = item.price;

  const imageId = resolveItemImageId(item, imageCache);
  if (imageId !== null) {
    ws.addImage(imageId, {
      tl: { col: 3.05, row: rowIndex - 1 + 0.05 },
      ext: { width: 60, height: 60 },
      editAs: "oneCell",
    } as Parameters<typeof ws.addImage>[1]);
  }
}

function writeOrderRows(
  ws: ExcelJS.Worksheet,
  order: OrderWithUser,
  startRow: number,
  imageCache: Map<string, number>,
): number {
  const items = (order.order_items || [])
    .filter((item) => item.products?.name)
    .sort((a, b) => a.id.localeCompare(b.id));
  const rowCount = Math.max(items.length, 1);
  const endRow = startRow + rowCount - 1;

  for (let i = 0; i < rowCount; i++) {
    const row = ws.getRow(startRow + i);
    row.height = 55;
    if (i === 0) writeOrderHeaderCells(row, order);
    writeItemCells(row, ws, items[i], startRow + i, imageCache);
    styleDataRow(row);
  }

  if (rowCount > 1) {
    const mergeCols = [1, 2, 3, 9, 10, 11, 12];
    for (const col of mergeCols) {
      ws.mergeCells(startRow, col, endRow, col);
    }
  }
  return endRow + 1;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, fileNameSuffix: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `захиалга_${new Date().toISOString().split("T")[0]}${fileNameSuffix}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

const HEADERS = [
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

async function exportOrdersToExcel(
  orders: OrderWithUser[],
  opts?: { fileIndex?: number; totalFiles?: number },
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Захиалга");

  configureWorksheet(ws, HEADERS);
  const imageCache = await prefetchImages(orders, workbook);

  let currentRow = 2;
  for (const order of orders) {
    currentRow = writeOrderRows(ws, order, currentRow, imageCache);
  }

  const suffix =
    opts?.totalFiles && opts.totalFiles > 1
      ? `_хэсэг${opts.fileIndex! + 1}-${opts.totalFiles}`
      : "";
  await downloadWorkbook(workbook, suffix);
}

/**
 * Browser-side multi-file export. Splits an arbitrary-size order list into
 * N xlsx files each capped at ORDERS_PER_EXPORT_FILE rows. Sequential
 * awaits + brief delays let the browser handle each download gesture
 * without suppressing later ones.
 */
export async function exportOrdersToExcelChunked(
  orders: OrderWithUser[],
): Promise<{ fileCount: number }> {
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
    await new Promise((r) => setTimeout(r, 300));
  }
  return { fileCount: chunks.length };
}
