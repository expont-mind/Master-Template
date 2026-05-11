"use client";

import {
  type ColumnDef,
  type TableMeta,
  type RowSelectionState,
  type OnChangeFn,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** Background refetch — table stays visible but dims during update. */
  isFetching?: boolean;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  meta?: TableMeta<TData>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isFetching,
  onRowClick,
  onRowDoubleClick,
  emptyTitle = "Мэдээлэл байхгүй",
  emptyDescription = "Одоогоор мэдээлэл бүртгэгдээгүй байна",
  emptyIcon: EmptyIcon,
  meta,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    meta,
    ...(rowSelection !== undefined && {
      state: { rowSelection },
      enableRowSelection: true,
      onRowSelectionChange,
    }),
  });

  // Initial load: show a skeleton of rows rather than a blank centred
  // spinner. Keeps the visual weight consistent so the layout doesn't
  // jump when data arrives.
  if (isLoading) {
    const skeletonColCount = Math.max(1, columns.length);
    return (
      <div className="rounded-md border border-slate-200 overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              {Array.from({ length: skeletonColCount }).map((_, i) => (
                <TableHead key={i}>
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <TableRow key={rowIdx} className="h-[72px]">
                {Array.from({ length: skeletonColCount }).map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <div className="h-4 w-full max-w-[200px] animate-pulse rounded bg-slate-100" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {EmptyIcon && (
          <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg font-medium">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-slate-200 overflow-x-auto transition-opacity",
        // Background refetch visual: fade the table slightly so users
        // know the data isn't the final view yet, without blanking.
        isFetching && "opacity-70",
      )}
    >
      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className={cn((onRowClick || onRowDoubleClick) && "cursor-pointer h-[72px]")}
              onClick={() => onRowClick?.(row.original)}
              onDoubleClick={() => onRowDoubleClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
