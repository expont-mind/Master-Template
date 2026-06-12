"use client";

import { Plus, HelpCircle } from "lucide-react";
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
import { CONTENT_STATUS_LABELS, FAQ_CATEGORIES } from "@/constants";
import { useFaqList } from "@/hooks/useFaqList";

import { getColumns } from "./columns";

export function FaqList() {
  const router = useRouter();
  const {
    filteredFaqs,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useFaqList();

  const columns = useMemo(() => getColumns({ onDelete: handleDeleteClick }), [handleDeleteClick]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">FAQ</p>
        <Link href="/faqs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ асуулт
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Асуулт, хариулт хайх..."
        resultCount={totalCount ?? filteredFaqs.length}
        resultLabel="асуулт"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {Object.entries(CONTENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ангилал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх ангилал</SelectItem>
            {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={filteredFaqs}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/faqs/${row.id}`)}
        emptyTitle="FAQ байхгүй"
        emptyDescription="Түгээмэл асуултууд нэмж эхэлнэ үү"
        emptyIcon={HelpCircle}
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
        title="Асуулт устгах"
        description={`"${deleteTarget?.question}" асуултыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
