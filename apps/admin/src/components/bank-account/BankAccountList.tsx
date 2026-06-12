"use client";

import { Plus, Banknote } from "lucide-react";
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
import { useBankAccountList } from "@/hooks/useBankAccountList";

import { getColumns } from "./columns";

export function BankAccountList() {
  const router = useRouter();
  const {
    filteredAccounts,
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
  } = useBankAccountList();

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: (item) => setDeleteTarget(item),
      }),
    [setDeleteTarget],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Банкны данс</p>
        <Link href="/bank-accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ данс
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Банкны данс хайх..."
        resultCount={totalCount ?? filteredAccounts.length}
        resultLabel="данс"
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
        data={filteredAccounts}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/bank-accounts/${row.id}`)}
        emptyTitle="Банкны данс байхгүй"
        emptyDescription="Эхний банкны дансаа үүсгэнэ үү"
        emptyIcon={Banknote}
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
        title="Банкны данс устгах"
        description={`"${deleteTarget?.bank_name} - ${deleteTarget?.account_number}" дансыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
