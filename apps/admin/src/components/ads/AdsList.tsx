"use client";

import { Plus, Megaphone } from "lucide-react";
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
import { useAdsList } from "@/hooks/useAdsList";

import { getColumns } from "./columns";
import { AD_POSITIONS } from "./types";

export function AdsList() {
  const router = useRouter();
  const {
    filteredAds,
    isLoading,
    searchQuery,
    setSearchQuery,
    positionFilter,
    setPositionFilter,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    setDeleteTarget,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useAdsList();

  const columns = useMemo(
    () => getColumns({ onDelete: (ad) => setDeleteTarget(ad) }),
    [setDeleteTarget],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Зар сурталчилгаа</p>
        <Link href="/ads/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ зар
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Зар хайх..."
        resultCount={totalCount ?? filteredAds.length}
        resultLabel="зар"
      >
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Байршил" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх байршил</SelectItem>
            {AD_POSITIONS.map((pos) => (
              <SelectItem key={pos.value} value={pos.value}>
                {pos.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
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
        data={filteredAds}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/ads/${row.id}`)}
        emptyTitle="Зар байхгүй"
        emptyDescription="Эхний зараа үүсгэнэ үү"
        emptyIcon={Megaphone}
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
        title="Зар устгах"
        description={`"${deleteTarget?.title}" зарыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
