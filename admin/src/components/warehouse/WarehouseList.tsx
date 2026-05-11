"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  DataTableToolbar,
  DataTablePagination,
} from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Warehouse } from "lucide-react";
import { useWarehouseList } from "@/hooks/useWarehouseList";
import { WAREHOUSE_TYPES } from "./types";
import { getColumns } from "./columns";

export function WarehouseList() {
  const router = useRouter();
  const {
    filteredWarehouses,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deleteTarget,
    setDeleteTarget,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useWarehouseList();

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: (item) => setDeleteTarget(item),
      }),
    [setDeleteTarget]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Агуулах</p>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ агуулах
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Агуулах хайх..."
        resultCount={totalCount ?? filteredWarehouses.length}
        resultLabel="агуулах"
      >
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Төрөл" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төрөл</SelectItem>
            {WAREHOUSE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            <SelectItem value="active">Идэвхтэй</SelectItem>
            <SelectItem value="inactive">Идэвхгүй</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={filteredWarehouses}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/warehouses/${row.id}`)}
        emptyTitle="Агуулах байхгүй"
        emptyDescription="Эхний агуулахаа үүсгэнэ үү"
        emptyIcon={Warehouse}
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
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Агуулах устгах"
        description={`"${deleteTarget?.name}" агуулахыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
