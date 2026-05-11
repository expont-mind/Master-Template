import { useCallback, useState } from "react";
import type ExcelJS from "exceljs";
import type { OrderWithUser } from "./types";
import { parseAsUTC } from "@/lib/utils/formatters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";

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

function OrderLabel({ order }: { order: OrderWithUser }) {
  const customerName =
    [order.users?.first_name, order.users?.last_name]
      .filter(Boolean)
      .join(" ") || "-";
  const phone = order.users?.primary_phone || "-";
  const address =
    [order.delivery_city, order.delivery_district, order.delivery_sub_district]
      .filter(Boolean)
      .join(", ") || "-";
  const additionalInfo = order.delivery_detail || order.order_number || "-";
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
  const orderDate = formatDateForPrint(order.created_at);
  const items = (order.order_items || []).filter((item) => item.products?.name).sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="print:break-after-page">
      {/* Customer info table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["ЗАХИАЛАГЧИЙН НЭР", "ДУГААР", "ХАЯГ", "НЭМЭЛТ МЭДЭЭЛЭЛ"].map(
              (label) => (
                <th
                  key={label}
                  className="bg-[#3d6b7e] text-white font-bold text-center p-3 border-2 border-[#2d5060] print:bg-gray-100 print:text-black print:border-gray-400 text-xs"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 border border-gray-300 text-center align-middle text-sm">
              {customerName}
            </td>
            <td className="p-3 border border-gray-300 text-center align-middle text-sm">
              {phone}
            </td>
            <td className="p-3 border border-gray-300 text-left align-middle font-bold text-sm">
              {address}
            </td>
            <td className="p-3 border border-gray-300 text-center align-middle text-sm">
              {additionalInfo}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Products table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr>
            {[
              "ЗУРАГ",
              "БҮТЭЭГДЭХҮҮНИЙ НЭР",
              "ТОО",
              "СОНГОЛТ",
              "ЗАХИАЛГЫН ДУГААР",
              "ОГНОО",
            ].map((label) => (
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
          {items.map((item, index) => {
            const primaryImage = item.products?.product_images?.find(
              (img) => img.is_primary
            );
            const image = primaryImage || item.products?.product_images?.[0];
            return (
              <tr key={item.id}>
                <td className="p-3 border border-gray-300 text-center align-middle">
                  {image ? (
                    <img
                      src={image.url}
                      alt=""
                      className="w-16 h-16 object-contain mx-auto print:w-12 print:h-12"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 border border-gray-300 text-center align-middle text-sm">
                  {item.products?.name || "-"}
                </td>
                <td className="p-3 border border-gray-300 text-center align-middle text-sm">
                  {item.quantity}
                </td>
                <td className="p-3 border border-gray-300 text-center align-middle text-sm">
                  {item.variant_name || "-"}
                </td>
                {index === 0 && (
                  <>
                    <td rowSpan={items.length} className="p-3 border border-gray-300 text-center align-middle text-sm">
                      {orderNumber}
                    </td>
                    <td rowSpan={items.length} className="p-3 border border-gray-300 text-center align-middle text-sm">
                      {orderDate}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface OrderBoxPrintSheetProps {
  orders: OrderWithUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted?: (orderIds: string[]) => void;
}

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF3D6B7E" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 10,
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF2D5060" } },
  bottom: { style: "thin", color: { argb: "FF2D5060" } },
  left: { style: "thin", color: { argb: "FF2D5060" } },
  right: { style: "thin", color: { argb: "FF2D5060" } },
};

const DATA_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

const CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

function applyHeaderStyle(row: ExcelJS.Row, colCount: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = HEADER_BORDER;
      cell.alignment = CENTER_ALIGNMENT;
    }
  });
}

function applyDataStyle(row: ExcelJS.Row, colCount: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.border = DATA_BORDER;
      cell.alignment = CENTER_ALIGNMENT;
      cell.font = { size: 10 };
    }
  });
}

// Detect actual image format from magic bytes
function detectImageFormat(buffer: ArrayBuffer): "png" | "jpeg" | "webp" | "unknown" {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "png";
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "jpeg";
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return "unknown";
}

// Convert image buffer to PNG via Canvas (for WebP/AVIF that ExcelJS can't handle)
async function convertToPng(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer | null> {
  const blob = new Blob([buffer], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    const loaded = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      img.onload = () => { clearTimeout(timeout); resolve(true); };
      img.onerror = () => { clearTimeout(timeout); resolve(false); };
      img.src = blobUrl;
    });
    if (!loaded || img.naturalWidth === 0) return null;

    const maxDim = 200;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) return null;
    return pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function fetchImageBuffer(
  url: string
): Promise<{ buffer: ArrayBuffer; extension: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const format = detectImageFormat(buffer);

    // PNG/JPEG: use directly — ExcelJS supports these natively
    if (format === "jpeg") return { buffer, extension: "jpeg" };
    if (format === "png") return { buffer, extension: "png" };

    // WebP/unknown: convert to PNG via Canvas
    const contentType = res.headers.get("content-type") || "image/webp";
    const pngBuffer = await convertToPng(buffer, contentType);
    if (!pngBuffer) return null;
    return { buffer: pngBuffer, extension: "png" };
  } catch {
    return null;
  }
}

async function exportBoxLabelsToExcel(orders: OrderWithUser[]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Шошго");

  ws.pageSetup = {
    paperSize: 9,           // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,         // no vertical constraint
  };

  // Column widths: A=ЗУРАГ, B=НЭР, C=ТОО/ХАЯГ1, D=СОНГОЛТ/ХАЯГ2, E=ДУГААР/НЭМЭЛТ1, F=ОГНОО/НЭМЭЛТ2
  ws.columns = [
    { width: 12 }, // A - ЗУРАГ
    { width: 22 }, // B - БҮТЭЭГДЭХҮҮНИЙ НЭР / ДУГААР
    { width: 14 }, // C - ТОО / ХАЯГ part 1
    { width: 14 }, // D - СОНГОЛТ / ХАЯГ part 2
    { width: 14 }, // E - ЗАХИАЛГЫН ДУГААР / НЭМЭЛТ part 1
    { width: 14 }, // F - ОГНОО / НЭМЭЛТ part 2
  ];

  // Pre-fetch all unique images
  const imageUrlSet = new Set<string>();
  for (const order of orders) {
    const items = (order.order_items || []).filter((item) => item.products?.name);
    for (const item of items) {
      const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
      const image = primaryImage || item.products?.product_images?.[0];
      if (image?.url) imageUrlSet.add(image.url);
    }
  }

  const imageCache = new Map<string, number>();
  await Promise.all(
    [...imageUrlSet].map(async (url) => {
      const result = await fetchImageBuffer(url);
      if (result) {
        const imageId = workbook.addImage({
          buffer: result.buffer,
          extension: result.extension,
        });
        imageCache.set(url, imageId);
      }
    })
  );

  const productHeaders = ["ЗУРАГ", "БҮТЭЭГДЭХҮҮНИЙ НЭР", "ТОО", "СОНГОЛТ", "ЗАХИАЛГЫН ДУГААР", "ОГНОО"];

  let currentRow = 1;

  for (let oi = 0; oi < orders.length; oi++) {
    const order = orders[oi];
    const customerName =
      [order.users?.first_name, order.users?.last_name]
        .filter(Boolean)
        .join(" ") || "-";
    const phone = order.users?.primary_phone || "-";
    const address =
      [order.delivery_city, order.delivery_district, order.delivery_sub_district]
        .filter(Boolean)
        .join(", ") || "-";
    const additionalInfo = order.delivery_detail || order.order_number || "-";
    const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
    const orderDate = formatDateForPrint(order.created_at);
    const items = (order.order_items || []).filter((item) => item.products?.name).sort((a, b) => a.id.localeCompare(b.id));

    // --- Customer info header (4 logical cols across 6 physical cols) ---
    const custHeaderRow = ws.getRow(currentRow);
    custHeaderRow.getCell(1).value = "ЗАХИАЛАГЧИЙН НЭР";
    custHeaderRow.getCell(2).value = "ДУГААР";
    custHeaderRow.getCell(3).value = "ХАЯГ";
    ws.mergeCells(currentRow, 3, currentRow, 4);    // ХАЯГ spans C-D
    custHeaderRow.getCell(5).value = "НЭМЭЛТ МЭДЭЭЛЭЛ";
    ws.mergeCells(currentRow, 5, currentRow, 6);    // НЭМЭЛТ spans E-F
    applyHeaderStyle(custHeaderRow, 6);
    custHeaderRow.height = 24;
    currentRow++;

    // --- Customer info data (4 logical cols across 6 physical cols) ---
    const custDataRow = ws.getRow(currentRow);
    custDataRow.getCell(1).value = customerName;
    custDataRow.getCell(2).value = phone;
    custDataRow.getCell(3).value = address;
    ws.mergeCells(currentRow, 3, currentRow, 4);    // address spans C-D
    custDataRow.getCell(5).value = additionalInfo;
    ws.mergeCells(currentRow, 5, currentRow, 6);    // additionalInfo spans E-F
    applyDataStyle(custDataRow, 6);
    custDataRow.height = 28;
    currentRow++;

    // --- Product header row (6 cols) ---
    const prodHeaderRow = ws.getRow(currentRow);
    productHeaders.forEach((h, i) => { prodHeaderRow.getCell(i + 1).value = h; });
    applyHeaderStyle(prodHeaderRow, 6);
    prodHeaderRow.height = 24;
    currentRow++;

    // --- Product data rows ---
    if (items.length === 0) {
      const emptyRow = ws.getRow(currentRow);
      ["-", "-", "0", "-", orderNumber, orderDate].forEach((v, i) => {
        emptyRow.getCell(i + 1).value = v;
      });
      applyDataStyle(emptyRow, 6);
      emptyRow.height = 50;
      currentRow++;
    } else {
      const startRow = currentRow;
      for (let ii = 0; ii < items.length; ii++) {
        const item = items[ii];
        const dataRow = ws.getRow(currentRow);
        const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
        const image = primaryImage || item.products?.product_images?.[0];

        // Col A: image placeholder (leave empty, image is overlaid)
        dataRow.getCell(1).value = "";
        dataRow.getCell(2).value = item.products?.name || "-";
        dataRow.getCell(3).value = item.quantity;
        dataRow.getCell(4).value = item.variant_name || "-";
        if (ii === 0) {
          dataRow.getCell(5).value = orderNumber;
          dataRow.getCell(6).value = orderDate;
        }
        applyDataStyle(dataRow, 6);
        dataRow.height = 50;

        // Embed image
        if (image?.url && imageCache.has(image.url)) {
          const imageId = imageCache.get(image.url)!;
          ws.addImage(imageId, {
            tl: { col: 0.05, row: currentRow - 1 + 0.05 },
            ext: { width: 60, height: 60 },
            editAs: 'oneCell',
          } as Parameters<typeof ws.addImage>[1]);
        }

        currentRow++;
      }
      if (items.length > 1) {
        ws.mergeCells(startRow, 5, startRow + items.length - 1, 5);
        ws.mergeCells(startRow, 6, startRow + items.length - 1, 6);
      }
    }

    // --- 2 blank rows between orders ---
    if (oi < orders.length - 1) {
      currentRow += 2;
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `хайрцагны_шошго_${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OrderBoxPrintSheet({
  orders,
  open,
  onOpenChange,
  onPrinted,
}: OrderBoxPrintSheetProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await exportBoxLabelsToExcel(orders);
      onPrinted?.(orders.map((o) => o.id));
    } finally {
      setIsDownloading(false);
    }
  }, [orders, onPrinted]);

  return (
    <>
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
          .print\\:break-after-page {
            break-after: page;
          }
          .print\\:break-after-page:last-child {
            break-after: auto;
          }
        }
      `}</style>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-4xl w-full overflow-hidden flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <div>
              <SheetTitle>Хайрцагны хэвлэмэл</SheetTitle>
              <SheetDescription>
                {orders.length} захиалгын шошго
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? "Татаж байна..." : "Татах"}
              </Button>
              <Button size="sm" onClick={() => {
                window.print();
                onPrinted?.(orders.map((o) => o.id));
              }}>
                <Printer className="h-4 w-4 mr-2" />
                Хэвлэх
              </Button>
            </div>
          </SheetHeader>
          <div
            data-print-content
            className="flex-1 overflow-y-auto px-4 pb-4"
          >
            {orders.map((order, index) => (
              <div key={order.id}>
                {index > 0 && (
                  <hr className="border-dashed border-gray-300 my-6 print:hidden" />
                )}
                <OrderLabel order={order} />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
