"use client";

import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTablePagination } from "@/components/ui/data-table";
import { useProductList } from "@/hooks/useProductList";

import { useProductExport } from "./_useProductExport";
import { useProductListLookups } from "./_useProductListLookups";
import { useProductRowNavigation } from "./_useProductRowNavigation";
import { getColumns } from "./columns";
import { ProductListFilters } from "./ProductListFilters";
import { ProductListToolbar } from "./ProductListToolbar";
import { QrCodeDialog } from "./QrCodeDialog";

import type { Product } from "./types";

export function ProductList() {
  const router = useRouter();
  const {
    filteredProducts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    discountFilter,
    setDiscountFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    sortOption,
    setSortOption,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    rowSelection,
    setRowSelection,
    selectedCount,
  } = useProductList();

  const { categories, brands } = useProductListLookups();

  const { isExporting, handleExport } = useProductExport({
    searchQuery,
    statusFilter,
    stockFilter,
    discountFilter,
    categoryFilter,
    brandFilter,
    dateFrom,
    dateTo,
  });

  const [qrTarget, setQrTarget] = useState<Product | null>(null);
  const { handleRowClick, handleRowDoubleClick } = useProductRowNavigation();

  const handleQrClick = useCallback((product: Product) => setQrTarget(product), []);

  const handleDuplicate = useCallback(
    (product: Product) => {
      router.push(`/products/new?duplicate=${product.id}`);
    },
    [router],
  );

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: handleDeleteClick,
        onQrClick: handleQrClick,
        onDuplicate: handleDuplicate,
      }),
    [handleDeleteClick, handleQrClick, handleDuplicate],
  );

  return (
    <div className="space-y-4">
      <ProductListToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        sortOption={sortOption}
        setSortOption={setSortOption}
        isExporting={isExporting}
        onExport={handleExport}
        onAddNew={() => router.push("/products/new")}
      />

      <ProductListFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        discountFilter={discountFilter}
        setDiscountFilter={setDiscountFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        categories={categories}
        brands={brands}
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
        emptyTitle="Бүтээгдэхүүн байхгүй"
        emptyDescription="Эхний бүтээгдэхүүнээ нэмнэ үү"
        emptyIcon={Package}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        selectedCount={selectedCount}
      />

      <QrCodeDialog
        open={!!qrTarget}
        onOpenChange={(open) => !open && setQrTarget(null)}
        productName={qrTarget?.name}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && handleDeleteCancel()}
        title="Бүтээгдэхүүн устгах"
        description={`"${deleteTarget?.name}" бүтээгдэхүүнийг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
