// Excel export for box-label printing. Produces a single landscape A4
// worksheet with a header row per order containing customer info, a
// product table, and an embedded product image. Each order is separated
// by two blank rows for visual breathing room.

import { parseAsUTC } from "@/lib/utils/formatters";

import { fetchImageBuffer } from "./_boxLabelImage";
import { applyDataStyle, applyHeaderStyle } from "./_boxLabelStyles";

import type { OrderWithUser } from "./types";
import type ExcelJS from "exceljs";

function formatDateForPrint(dateString: string): string {
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

const PRODUCT_HEADERS = [
  "ЗУРАГ",
  "БҮТЭЭГДЭХҮҮНИЙ НЭР",
  "ТОО",
  "СОНГОЛТ",
  "ЗАХИАЛГЫН ДУГААР",
  "ОГНОО",
];

interface OrderRowData {
  customerName: string;
  phone: string;
  address: string;
  additionalInfo: string;
  orderNumber: string;
  orderDate: string;
  items: NonNullable<OrderWithUser["order_items"]>;
}

function extractOrderRowData(order: OrderWithUser): OrderRowData {
  const customerName =
    [order.users?.first_name, order.users?.last_name].filter(Boolean).join(" ") || "-";
  const phone = order.users?.primary_phone || "-";
  const address =
    [order.delivery_city, order.delivery_district, order.delivery_sub_district]
      .filter(Boolean)
      .join(", ") || "-";
  const additionalInfo = order.delivery_detail || order.order_number || "-";
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
  const orderDate = formatDateForPrint(order.created_at);
  const items = (order.order_items || [])
    .filter((item) => item.products?.name)
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    customerName,
    phone,
    address,
    additionalInfo,
    orderNumber,
    orderDate,
    items,
  };
}

// Setup column widths + page settings for the worksheet
function configureWorksheet(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.columns = [
    { width: 12 }, // A - ЗУРАГ
    { width: 22 }, // B - БҮТЭЭГДЭХҮҮНИЙ НЭР / ДУГААР
    { width: 14 }, // C - ТОО / ХАЯГ part 1
    { width: 14 }, // D - СОНГОЛТ / ХАЯГ part 2
    { width: 14 }, // E - ЗАХИАЛГЫН ДУГААР / НЭМЭЛТ part 1
    { width: 14 }, // F - ОГНОО / НЭМЭЛТ part 2
  ];
}

// Build the cache of preloaded images for all unique product image URLs
async function buildImageCache(
  workbook: ExcelJS.Workbook,
  orders: OrderWithUser[],
): Promise<Map<string, number>> {
  const imageUrlSet = new Set<string>();
  for (const order of orders) {
    const items = (order.order_items || []).filter((item) => item.products?.name);
    for (const item of items) {
      const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
      const image = primaryImage || item.products?.product_images?.[0];
      if (image?.url) imageUrlSet.add(image.url);
    }
  }

  const cache = new Map<string, number>();
  await Promise.all(
    [...imageUrlSet].map(async (url) => {
      const result = await fetchImageBuffer(url);
      if (result) {
        const imageId = workbook.addImage({
          buffer: result.buffer,
          extension: result.extension,
        });
        cache.set(url, imageId);
      }
    }),
  );
  return cache;
}

// Write the customer-info header + data rows. Returns the new currentRow.
function writeCustomerSection(
  ws: ExcelJS.Worksheet,
  currentRow: number,
  data: OrderRowData,
): number {
  const custHeaderRow = ws.getRow(currentRow);
  custHeaderRow.getCell(1).value = "ЗАХИАЛАГЧИЙН НЭР";
  custHeaderRow.getCell(2).value = "ДУГААР";
  custHeaderRow.getCell(3).value = "ХАЯГ";
  ws.mergeCells(currentRow, 3, currentRow, 4); // ХАЯГ spans C-D
  custHeaderRow.getCell(5).value = "НЭМЭЛТ МЭДЭЭЛЭЛ";
  ws.mergeCells(currentRow, 5, currentRow, 6); // НЭМЭЛТ spans E-F
  applyHeaderStyle(custHeaderRow, 6);
  custHeaderRow.height = 24;
  currentRow++;

  const custDataRow = ws.getRow(currentRow);
  custDataRow.getCell(1).value = data.customerName;
  custDataRow.getCell(2).value = data.phone;
  custDataRow.getCell(3).value = data.address;
  ws.mergeCells(currentRow, 3, currentRow, 4);
  custDataRow.getCell(5).value = data.additionalInfo;
  ws.mergeCells(currentRow, 5, currentRow, 6);
  applyDataStyle(custDataRow, 6);
  custDataRow.height = 28;
  currentRow++;
  return currentRow;
}

// Write product header row. Returns the new currentRow.
function writeProductHeader(ws: ExcelJS.Worksheet, currentRow: number): number {
  const prodHeaderRow = ws.getRow(currentRow);
  PRODUCT_HEADERS.forEach((h, i) => {
    prodHeaderRow.getCell(i + 1).value = h;
  });
  applyHeaderStyle(prodHeaderRow, 6);
  prodHeaderRow.height = 24;
  return currentRow + 1;
}

function writeEmptyItemsRow(
  ws: ExcelJS.Worksheet,
  currentRow: number,
  orderNumber: string,
  orderDate: string,
): number {
  const emptyRow = ws.getRow(currentRow);
  ["-", "-", "0", "-", orderNumber, orderDate].forEach((v, i) => {
    emptyRow.getCell(i + 1).value = v;
  });
  applyDataStyle(emptyRow, 6);
  emptyRow.height = 50;
  return currentRow + 1;
}

function pickItemImage(item: OrderRowData["items"][number]) {
  const images = item.products?.product_images ?? [];
  const primary = images.find((img) => img.is_primary);
  return primary ?? images[0];
}

function embedItemImage(ws: ExcelJS.Worksheet, currentRow: number, imageId: number): void {
  ws.addImage(imageId, {
    tl: { col: 0.05, row: currentRow - 1 + 0.05 },
    ext: { width: 60, height: 60 },
    editAs: "oneCell",
  } as Parameters<typeof ws.addImage>[1]);
}

// Write a single item row, embedding the product image when available.
function writeItemRow(
  ws: ExcelJS.Worksheet,
  currentRow: number,
  item: OrderRowData["items"][number],
  isFirstItem: boolean,
  orderNumber: string,
  orderDate: string,
  imageCache: Map<string, number>,
): void {
  const dataRow = ws.getRow(currentRow);
  const image = pickItemImage(item);
  const productName = item.products?.name ?? "-";
  const variantName = item.variant_name ?? "-";

  dataRow.getCell(1).value = "";
  dataRow.getCell(2).value = productName;
  dataRow.getCell(3).value = item.quantity;
  dataRow.getCell(4).value = variantName;
  if (isFirstItem) {
    dataRow.getCell(5).value = orderNumber;
    dataRow.getCell(6).value = orderDate;
  }
  applyDataStyle(dataRow, 6);
  dataRow.height = 50;

  const imageUrl = image?.url;
  const imageId = imageUrl ? imageCache.get(imageUrl) : undefined;
  if (imageId !== undefined) {
    embedItemImage(ws, currentRow, imageId);
  }
}

function writeProductSection(
  ws: ExcelJS.Worksheet,
  currentRow: number,
  data: OrderRowData,
  imageCache: Map<string, number>,
): number {
  const { items, orderNumber, orderDate } = data;
  if (items.length === 0) {
    return writeEmptyItemsRow(ws, currentRow, orderNumber, orderDate);
  }
  const startRow = currentRow;
  for (let ii = 0; ii < items.length; ii++) {
    writeItemRow(ws, currentRow, items[ii], ii === 0, orderNumber, orderDate, imageCache);
    currentRow++;
  }
  if (items.length > 1) {
    ws.mergeCells(startRow, 5, startRow + items.length - 1, 5);
    ws.mergeCells(startRow, 6, startRow + items.length - 1, 6);
  }
  return currentRow;
}

function downloadWorkbook(buffer: ArrayBuffer | Buffer) {
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `хайрцагны_шошго_${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportBoxLabelsToExcel(orders: OrderWithUser[]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Шошго");

  configureWorksheet(ws);

  const imageCache = await buildImageCache(workbook, orders);

  let currentRow = 1;
  for (let oi = 0; oi < orders.length; oi++) {
    const data = extractOrderRowData(orders[oi]);
    currentRow = writeCustomerSection(ws, currentRow, data);
    currentRow = writeProductHeader(ws, currentRow);
    currentRow = writeProductSection(ws, currentRow, data, imageCache);
    // 2 blank rows between orders
    if (oi < orders.length - 1) currentRow += 2;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadWorkbook(buffer);
}
