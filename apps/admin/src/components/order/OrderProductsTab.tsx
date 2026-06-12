"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Package, Printer, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";

import { OrderProductsPrintSheet } from "./_OrderProductsPrintSheet";
import { OrderProductsTable } from "./_OrderProductsTable";
import { filterGroupedProducts, groupOrderItemsByProduct } from "./_productGrouping";
import { exportProductListToExcel } from "./_productListExport";

import type { OrderWithUser } from "./types";

const DEFAULT_PAGE_SIZE = 100;
const BATCH_SIZE = 100;

interface OrderProductsTabProps {
  selectedOrderIds: Set<string>;
  onPrinted?: () => void;
}

async function fetchSelectedOrders(selectedOrderIds: Set<string>): Promise<OrderWithUser[]> {
  const ids = [...selectedOrderIds];
  if (ids.length === 0) return [];
  const results: OrderWithUser[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);
    const batch = await adminApi.getAll<OrderWithUser>("orders", {
      select:
        "id, order_number, order_items(id, variant_name, quantity, is_returned, products(name, product_images(url, is_primary)))",
      filters: { "id.in": batchIds.join(",") },
    });
    results.push(...batch);
  }
  return results;
}

function ProductsHeader({
  totalProductCount,
  totalItems,
  orderCount,
  searchQuery,
  onSearchChange,
  onPrint,
  onDownload,
  isDownloading,
}: {
  totalProductCount: number;
  totalItems: number;
  orderCount: number;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onPrint: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-1 gap-3">
      <div className="relative w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Бараа хайх..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8"
        />
      </div>
      <div className="text-sm text-muted-foreground">
        {totalProductCount} бараа · {totalItems} ширхэг · {orderCount} захиалга
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Хэвлэх
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Татах
        </Button>
      </div>
    </div>
  );
}

export function OrderProductsTab({ selectedOrderIds, onPrinted }: OrderProductsTabProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const hasSelection = selectedOrderIds.size > 0;

  const selectedIdsKey = useMemo(() => [...selectedOrderIds].sort().join(","), [selectedOrderIds]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "products-tab-selected", selectedIdsKey],
    queryFn: () => fetchSelectedOrders(selectedOrderIds),
    enabled: hasSelection,
    staleTime: 60_000,
  });

  const grouped = useMemo(() => groupOrderItemsByProduct(orders), [orders]);
  const filtered = useMemo(
    () => filterGroupedProducts(grouped, searchQuery),
    [grouped, searchQuery],
  );

  const totalProductCount = filtered.length;
  const totalItems = filtered.reduce((sum, g) => sum + g.totalQuantity, 0);
  const pageCount = Math.ceil(totalProductCount / pageSize);
  const paginatedGroups = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await exportProductListToExcel(filtered);
    } finally {
      setIsDownloading(false);
    }
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-10 w-10 mb-2" />
        <p className="text-sm font-medium">Бараа байхгүй</p>
        <p className="text-xs">Захиалга сонгоно уу</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <ProductsHeader
          totalProductCount={totalProductCount}
          totalItems={totalItems}
          orderCount={orders.length}
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setPage(0);
          }}
          onPrint={() => setPrintSheetOpen(true)}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />

        <OrderProductsTable paginatedGroups={paginatedGroups} page={page} pageSize={pageSize} />

        {totalProductCount > 0 && (
          <DataTablePagination
            pageIndex={page}
            pageCount={pageCount}
            onPageChange={setPage}
            totalCount={totalProductCount}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        )}
      </div>

      <OrderProductsPrintSheet
        open={printSheetOpen}
        onOpenChange={setPrintSheetOpen}
        filtered={filtered}
        totalProductCount={totalProductCount}
        totalItems={totalItems}
        orderCount={orders.length}
        onDownload={handleDownload}
        isDownloading={isDownloading}
        onPrinted={onPrinted}
      />
    </>
  );
}
