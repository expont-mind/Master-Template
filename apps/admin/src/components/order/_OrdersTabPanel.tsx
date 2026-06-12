"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable, DataTablePagination } from "@/components/ui/data-table";

import { OrderListBulkActions } from "./OrderListBulkActions";
import { OrderListToolbar } from "./OrderListToolbar";

import type { OrderTableMeta } from "./columns";
import type { OrderWithUser } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

interface OrdersTabPanelProps {
  filteredOrders: OrderWithUser[];
  isLoading: boolean;
  columns: ColumnDef<OrderWithUser>[];
  tableMeta: OrderTableMeta;
  // toolbar
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalCount: number;
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (v: string) => void;
  sortOption: string;
  setSortOption: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  setDateRange: (from: string, to: string) => void;
  // bulk
  selectedCount: number;
  isBoxPrintLoading: boolean;
  isStickerLoading: boolean;
  isExporting: boolean;
  onBoxPrint: () => void;
  onStickerPrint: () => void;
  onDownload: () => void;
  // pagination
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  serverTotalCount: number | null;
}

export function OrdersTabPanel({
  filteredOrders,
  isLoading,
  columns,
  tableMeta,
  searchQuery,
  setSearchQuery,
  totalCount,
  paymentFilter,
  setPaymentFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  sortOption,
  setSortOption,
  dateFrom,
  dateTo,
  setDateRange,
  selectedCount,
  isBoxPrintLoading,
  isStickerLoading,
  isExporting,
  onBoxPrint,
  onStickerPrint,
  onDownload,
  page,
  totalPages,
  setPage,
  pageSize,
  setPageSize,
  serverTotalCount,
}: OrdersTabPanelProps) {
  const router = useRouter();

  return (
    <>
      <div className="space-y-3">
        <OrderListToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          resultCount={totalCount}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          paymentStatusFilter={paymentStatusFilter}
          setPaymentStatusFilter={setPaymentStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateRange={setDateRange}
        />
        <OrderListBulkActions
          selectedCount={selectedCount}
          isBoxPrintLoading={isBoxPrintLoading}
          isStickerLoading={isStickerLoading}
          isExporting={isExporting}
          onBoxPrint={onBoxPrint}
          onStickerPrint={onStickerPrint}
          onDownload={onDownload}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
        emptyTitle="Захиалга байхгүй"
        emptyDescription="Захиалга ирээгүй байна"
        emptyIcon={ShoppingCart}
        meta={tableMeta}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={serverTotalCount}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
