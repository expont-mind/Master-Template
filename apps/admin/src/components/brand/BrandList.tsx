"use client";

import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableToolbar, DataTablePagination } from "@/components/ui/data-table";
import { useBrandList } from "@/hooks/useBrandList";

import { BrandProductsDialog } from "./BrandProductsDialog";
import { BrandSectionSettings } from "./BrandSectionSettings";
import { getColumns } from "./columns";

import type { Brand } from "./types";

export function BrandList() {
  const router = useRouter();
  const {
    filteredBrands,
    isLoading,
    searchQuery,
    setSearchQuery,
    deleteTarget,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useBrandList();

  // Products dialog state
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsTarget, setProductsTarget] = useState<Brand | null>(null);

  const handleProductsClick = (brand: Brand) => {
    setProductsTarget(brand);
    setProductsOpen(true);
  };

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: handleDeleteClick,
        onProducts: handleProductsClick,
      }),
    [handleDeleteClick],
  );

  return (
    <div className="space-y-6">
      <BrandSectionSettings />

      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Брэнд</p>
        <Link href="/brands/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ брэнд
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Брэнд хайх..."
        resultCount={totalCount ?? filteredBrands.length}
        resultLabel="брэнд"
      />

      <DataTable
        columns={columns}
        data={filteredBrands}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/brands/${row.id}`)}
        emptyTitle="Брэнд байхгүй"
        emptyDescription="Эхний брэндээ үүсгэнэ үү"
        emptyIcon={Tag}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && handleDeleteCancel()}
        title="Брэнд устгах"
        description={`"${deleteTarget?.name}" брэндийг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <BrandProductsDialog
        open={productsOpen}
        onOpenChange={(open) => {
          setProductsOpen(open);
          if (!open) setTimeout(() => setProductsTarget(null), 300);
        }}
        brandId={productsTarget?.id ?? ""}
        brandName={productsTarget?.name ?? ""}
      />
    </div>
  );
}
