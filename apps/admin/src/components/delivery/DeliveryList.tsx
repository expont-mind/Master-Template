"use client";

import { Plus, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableToolbar, DataTablePagination } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeliveryList } from "@/hooks/useDeliveryList";

import { getColumns } from "./columns";

export function DeliveryList() {
  const router = useRouter();
  const {
    filteredZones,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useDeliveryList();

  const columns = useMemo(() => getColumns({ onDelete: handleDeleteClick }), [handleDeleteClick]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Хүргэлтийн бүс</p>
        <Link href="/deliveries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ бүс
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Бүс хайх..."
        resultCount={totalCount ?? filteredZones.length}
        resultLabel="бичлэг"
      >
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
        data={filteredZones}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/deliveries/${row.id}`)}
        emptyTitle="Хүргэлтийн бүс байхгүй"
        emptyDescription="Эхний хүргэлтийн бүсээ үүсгэнэ үү"
        emptyIcon={Truck}
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
        title="Хүргэлтийн бүс устгах"
        description={`"${deleteTarget?.name}" бүсийг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
