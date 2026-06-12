"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { useCallback, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePagination, DataTableToolbar } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/useDebounce";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useProductPerformanceColumns } from "./_perf-table/_columns";
import { PerformanceTableView } from "./_perf-table/_PerformanceTableView";
import { PAGE_SIZE, SORT_COLUMN_MAP, type PerfRow } from "./_perf-table/_types";

interface ProductPerformanceTableProps {
  dateFrom: string;
  dateTo: string;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Бүтээгдэхүүн олдсонгүй</h3>
      <p className="text-sm text-muted-foreground">Хайлтын үр дүн олдсонгүй</p>
    </div>
  );
}

function deriveSortParams(sorting: SortingState): { column: string; dir: "asc" | "desc" } {
  const first = sorting[0];
  if (!first) return { column: "qty_sold", dir: "desc" };
  return {
    column: SORT_COLUMN_MAP[first.id] ?? "qty_sold",
    dir: first.desc === false ? "asc" : "desc",
  };
}

export function ProductPerformanceTable({ dateFrom, dateTo }: ProductPerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "qtySold", desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 300);
  const { column: sortColumn, dir: sortDir } = deriveSortParams(sorting);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: queryKeys.analytics.productTable({
      search: debouncedSearch,
      sort: sortColumn,
      dir: sortDir,
      page: pageIndex,
      dateFrom,
      dateTo,
    }),
    queryFn: () =>
      adminApi.rpc<PerfRow[]>("get_product_performance", {
        p_search: debouncedSearch || null,
        p_sort_column: sortColumn,
        p_sort_dir: sortDir,
        p_limit: PAGE_SIZE,
        p_offset: pageIndex * PAGE_SIZE,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      }),
    placeholderData: keepPreviousData,
  });

  const totalCount = rows[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleToggleExpand = useCallback(
    (id: string) => setExpandedProductId((current) => (current === id ? null : id)),
    [],
  );

  const columns = useProductPerformanceColumns(expandedProductId, handleToggleExpand);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns functions React Compiler can't safely memoize; this is a known library limitation, not a code smell
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
      setExpandedProductId(null);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
    setExpandedProductId(null);
  }

  function handlePageChange(newPage: number) {
    setPageIndex(newPage);
    setExpandedProductId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бүх бүтээгдэхүүний гүйцэтгэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataTableToolbar
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Бүтээгдэхүүн хайх..."
          resultCount={totalCount}
          resultLabel="бүтээгдэхүүн"
        />

        {isLoading ? (
          <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <PerformanceTableView
              table={table}
              expandedProductId={expandedProductId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              columnCount={columns.length}
            />
            <DataTablePagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPageChange={handlePageChange}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
