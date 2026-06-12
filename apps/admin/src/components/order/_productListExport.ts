import { hasMultipleVariants, type GroupedProduct } from "./_productGrouping";
import { fetchImageBuffer } from "./OrderBoxPrint";

import type ExcelJS from "exceljs";

const COL_COUNT = 5;
const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4CAF50" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 10,
};
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};
const CENTER: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};
const HEADERS = ["#", "Зураг", "Бүтээгдэхүүний нэр", "Сонголт", "Тоо"];

function styleCells(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= COL_COUNT) {
      cell.border = BORDER;
      cell.alignment = CENTER;
      cell.font = { size: 10 };
    }
  });
}

function configureWorksheet(ws: ExcelJS.Worksheet) {
  ws.columns = [{ width: 6 }, { width: 10 }, { width: 30 }, { width: 15 }, { width: 8 }];
  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  const headerRow = ws.getRow(1);
  HEADERS.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
  });
  headerRow.height = 28;
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= COL_COUNT) {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = BORDER;
      cell.alignment = CENTER;
    }
  });
}

async function prefetchImages(
  groups: GroupedProduct[],
  workbook: ExcelJS.Workbook,
): Promise<Map<string, number>> {
  const urls = [...new Set(groups.map((g) => g.imageUrl).filter((u): u is string => !!u))];
  const cache = new Map<string, number>();
  await Promise.all(
    urls.map(async (url) => {
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

function writeGroupRows(
  ws: ExcelJS.Worksheet,
  group: GroupedProduct,
  groupIndex: number,
  startRow: number,
  imageCache: Map<string, number>,
): number {
  const multiple = hasMultipleVariants(group);
  const rowCount = multiple ? group.variants.length : 1;

  for (let vi = 0; vi < rowCount; vi++) {
    const currentRow = startRow + vi;
    const row = ws.getRow(currentRow);
    row.height = 50;

    if (vi === 0) {
      row.getCell(1).value = groupIndex + 1;
      row.getCell(2).value = "";
      row.getCell(3).value = group.productName;
      if (group.imageUrl && imageCache.has(group.imageUrl)) {
        ws.addImage(imageCache.get(group.imageUrl)!, {
          tl: { col: 1.05, row: currentRow - 1 + 0.05 },
          ext: { width: 60, height: 60 },
          editAs: "oneCell",
        } as Parameters<typeof ws.addImage>[1]);
      }
    }

    if (multiple) {
      const v = group.variants[vi];
      row.getCell(4).value = v.variantName || "-";
      row.getCell(5).value = v.quantity;
    } else {
      row.getCell(4).value = "-";
      row.getCell(5).value = group.totalQuantity;
    }
    styleCells(row);
  }

  if (rowCount > 1) {
    const endRow = startRow + rowCount - 1;
    ws.mergeCells(startRow, 1, endRow, 1);
    ws.mergeCells(startRow, 2, endRow, 2);
    ws.mergeCells(startRow, 3, endRow, 3);
  }
  return startRow + rowCount;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportProductListToExcel(groups: GroupedProduct[]): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Бараа жагсаалт");

  configureWorksheet(ws);
  const imageCache = await prefetchImages(groups, workbook);

  let currentRow = 2;
  for (let i = 0; i < groups.length; i++) {
    currentRow = writeGroupRows(ws, groups[i], i, currentRow, imageCache);
  }

  await downloadWorkbook(workbook, `бараа_жагсаалт_${new Date().toISOString().split("T")[0]}.xlsx`);
}
