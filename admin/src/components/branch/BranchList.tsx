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
import { Plus, Store } from "lucide-react";
import { useBranchList } from "@/hooks/useBranchList";
import { getColumns } from "./columns";

export function BranchList() {
  const router = useRouter();
  const {
    filteredBranches,
    isLoading,
    searchQuery,
    setSearchQuery,
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
  } = useBranchList();

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
        <p className="text-3xl font-bold tracking-tight">Салбар</p>
        <Link href="/branches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ салбар
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Салбар хайх..."
        resultCount={totalCount ?? filteredBranches.length}
        resultLabel="салбар"
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
        data={filteredBranches}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/branches/${row.id}`)}
        emptyTitle="Салбар байхгүй"
        emptyDescription="Эхний салбараа үүсгэнэ үү"
        emptyIcon={Store}
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
        title="Салбар устгах"
        description={`"${deleteTarget?.name}" салбарыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
