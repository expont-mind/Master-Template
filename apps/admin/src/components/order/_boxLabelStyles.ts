// Excel styling tokens + style application helpers shared by the box-label
// export workbook builder.

import type ExcelJS from "exceljs";

export const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF3D6B7E" },
};

export const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 10,
};

export const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF2D5060" } },
  bottom: { style: "thin", color: { argb: "FF2D5060" } },
  left: { style: "thin", color: { argb: "FF2D5060" } },
  right: { style: "thin", color: { argb: "FF2D5060" } },
};

export const DATA_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

export const CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

export function applyHeaderStyle(row: ExcelJS.Row, colCount: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = HEADER_BORDER;
      cell.alignment = CENTER_ALIGNMENT;
    }
  });
}

export function applyDataStyle(row: ExcelJS.Row, colCount: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.border = DATA_BORDER;
      cell.alignment = CENTER_ALIGNMENT;
      cell.font = { size: 10 };
    }
  });
}
