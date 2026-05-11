"use client";

import { Fragment, useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTableToolbar, DataTablePagination } from "@/components/ui/data-table";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/constants";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// ── Row types ────────────────────────────────────────────────

interface PerfRow {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  status: string;
  qty_sold: number;
  revenue: number;
  stock: number;
  variant_count: number;
  avg_rating: number | null;
  review_count: number;
  total_count: number;
}

interface VariantSalesRow {
  variant_id: string;
  variant_name: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  qty_sold: number;
  revenue: number;
}

const PAGE_SIZE = 20;

// Map TanStack Table column IDs to SQL column names
const SORT_COLUMN_MAP: Record<string, string> = {
  name: "name",
  price: "price",
  qtySold: "qty_sold",
  revenue: "revenue",
  stock: "stock",
  variantCount: "variant_count",
  avgRating: "avg_rating",
};

// ── Helpers ──────────────────────────────────────────────────

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ArrowUp className="ml-1 h-3 w-3" />;
  if (isSorted === "desc") return <ArrowDown className="ml-1 h-3 w-3" />;
  return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
}

// ── Variant sub-rows ─────────────────────────────────────────

function VariantSubRows({
  productId,
  dateFrom,
  dateTo,
  colSpan,
}: {
  productId: string;
  dateFrom: string;
  dateTo: string;
  colSpan: number;
}) {
  const { data: variants, isLoading } = useQuery({
    queryKey: queryKeys.analytics.variantSales(productId, dateFrom, dateTo),
    queryFn: () =>
      adminApi.rpc<VariantSalesRow[]>("get_variant_sales", {
        p_product_id: productId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      }),
  });

  if (isLoading) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={colSpan}>
          <div className="flex items-center gap-2 pl-8 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Ачааллаж байна...
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!variants || variants.length === 0) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={colSpan}>
          <div className="pl-8 py-2 text-sm text-muted-foreground">
            Опцион олдсонгүй
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {variants.map((v) => (
        <TableRow key={v.variant_id} className="bg-muted/30 text-sm">
          {/* Name (indented) */}
          <TableCell>
            <span className="pl-8 text-muted-foreground">
              {v.variant_name || "—"}
            </span>
          </TableCell>
          {/* Price */}
          <TableCell>
            {v.discount_price ? (
              <div className="text-right">
                <span className="text-xs text-muted-foreground line-through">
                  ₮{v.price.toLocaleString()}
                </span>
                <span className="ml-1 font-medium text-red-600">
                  ₮{v.discount_price.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="text-right">₮{v.price.toLocaleString()}</div>
            )}
          </TableCell>
          {/* Status — empty for variants */}
          <TableCell />
          {/* Qty sold */}
          <TableCell>
            <div className="text-right">{v.qty_sold.toLocaleString()}</div>
          </TableCell>
          {/* Revenue */}
          <TableCell>
            <div className="text-right">₮{v.revenue.toLocaleString()}</div>
          </TableCell>
          {/* Stock */}
          <TableCell>
            <div className="text-right">
              <span
                className={
                  v.stock_quantity === 0
                    ? "text-red-600 font-medium"
                    : v.stock_quantity <= 5
                      ? "text-yellow-600 font-medium"
                      : ""
                }
              >
                {v.stock_quantity}
              </span>
            </div>
          </TableCell>
          {/* Variant count — empty */}
          <TableCell />
          {/* Rating — empty */}
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

// ── Component ────────────────────────────────────────────────

interface ProductPerformanceTableProps {
  dateFrom: string;
  dateTo: string;
}

export function ProductPerformanceTable({ dateFrom, dateTo }: ProductPerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "qtySold", desc: true },
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 300);

  // Derive sort params from TanStack sorting state
  const sortColumn = sorting[0]
    ? SORT_COLUMN_MAP[sorting[0].id] ?? "qty_sold"
    : "qty_sold";
  const sortDir = sorting[0]?.desc === false ? "asc" : "desc";

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

  const columns = useMemo<ColumnDef<PerfRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Нэр
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const p = row.original;
          const isExpanded = expandedProductId === p.id;
          const hasVariants = p.variant_count > 0;

          return (
            <div className="flex items-center gap-1.5">
              {hasVariants ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedProductId(isExpanded ? null : p.id);
                  }}
                  className="shrink-0 rounded p-0.5 hover:bg-muted"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>
              ) : (
                <span className="w-5" />
              )}
              <Link
                href={`/analytics/products/${p.id}`}
                className="hover:underline font-medium"
              >
                {p.name}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Үнэ
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const p = row.original;
          if (p.discount_price) {
            return (
              <div className="text-right">
                <span className="text-xs text-muted-foreground line-through">
                  ₮{p.price.toLocaleString()}
                </span>
                <span className="ml-1 font-medium text-red-600">
                  ₮{p.discount_price.toLocaleString()}
                </span>
              </div>
            );
          }
          return <div className="text-right">₮{p.price.toLocaleString()}</div>;
        },
      },
      {
        accessorKey: "status",
        header: "Төлөв",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              PRODUCT_STATUS_COLORS[
                row.original.status as keyof typeof PRODUCT_STATUS_COLORS
              ] ?? ""
            }
          >
            {PRODUCT_STATUS_LABELS[
              row.original.status as keyof typeof PRODUCT_STATUS_LABELS
            ] ?? row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "qtySold",
        accessorFn: (row) => row.qty_sold,
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Зарагдсан
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.original.qty_sold.toLocaleString()}</div>
        ),
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Орлого
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            ₮{row.original.revenue.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Нөөц
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const stock = row.original.stock;
          return (
            <div className="text-right">
              <span
                className={
                  stock === 0
                    ? "text-red-600 font-medium"
                    : stock <= 5
                      ? "text-yellow-600 font-medium"
                      : ""
                }
              >
                {stock}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "variantCount",
        accessorFn: (row) => row.variant_count,
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Опцион
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.original.variant_count}</div>
        ),
      },
      {
        accessorKey: "avgRating",
        accessorFn: (row) => row.avg_rating,
        header: ({ column }) => (
          <button
            className="inline-flex items-center font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Үнэлгээ
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const p = row.original;
          if (p.avg_rating !== null) {
            return (
              <div className="text-right">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {Number(p.avg_rating).toFixed(1)}
                  <span className="text-muted-foreground text-xs">
                    ({p.review_count})
                  </span>
                </span>
              </div>
            );
          }
          return (
            <div className="text-right text-muted-foreground">—</div>
          );
        },
      },
    ],
    [expandedProductId],
  );

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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Бүтээгдэхүүн олдсонгүй</h3>
            <p className="text-sm text-muted-foreground">
              Хайлтын үр дүн олдсонгүй
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandedProductId === row.original.id && (
                        <VariantSubRows
                          productId={row.original.id}
                          dateFrom={dateFrom}
                          dateTo={dateTo}
                          colSpan={columns.length}
                        />
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

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
