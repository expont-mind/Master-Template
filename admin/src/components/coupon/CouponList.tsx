"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
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
import { Plus, Ticket } from "lucide-react";
import { COUPON_TYPE_LABELS } from "@/constants";
import { useCouponList } from "@/hooks/useCouponList";
import { getColumns } from "./columns";
import type { Coupon } from "./types";

export function CouponList() {
  const {
    filteredCoupons,
    isLoading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    handleDelete,
    handleToggleActive,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useCouponList();

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const onDelete = useCallback((coupon: Coupon) => {
    setDeleteTarget(coupon);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleDelete]);

  const columns = useMemo(
    () => getColumns({ onDelete, onToggleActive: handleToggleActive }),
    [onDelete, handleToggleActive]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Купон</p>
        <Link href="/coupons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ купон
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Купон хайх (код, нэр)..."
        resultCount={totalCount ?? filteredCoupons.length}
        resultLabel="купон"
      >
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Төрөл" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төрөл</SelectItem>
            {Object.entries(COUPON_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
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
        data={filteredCoupons}
        isLoading={isLoading}
        emptyTitle="Купон байхгүй"
        emptyDescription="Эхний купоныг үүсгэнэ үү"
        emptyIcon={Ticket}
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
        title="Купон устгах"
        description={`"${deleteTarget?.code}" купоныг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.`}
        confirmText="Устгах"
        cancelText="Цуцлах"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
