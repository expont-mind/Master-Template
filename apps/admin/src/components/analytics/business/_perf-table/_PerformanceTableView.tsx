"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { Fragment } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type PerfRow } from "./_types";
import { VariantSubRows } from "./_VariantSubRows";

interface PerformanceTableViewProps {
  table: TanstackTable<PerfRow>;
  expandedProductId: string | null;
  dateFrom: string;
  dateTo: string;
  columnCount: number;
}

export function PerformanceTableView({
  table,
  expandedProductId,
  dateFrom,
  dateTo,
  columnCount,
}: PerformanceTableViewProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {expandedProductId === row.original.id && (
                <VariantSubRows
                  productId={row.original.id}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  colSpan={columnCount}
                />
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
