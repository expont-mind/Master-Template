"use client";

import { Plus, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";

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
import { CONTENT_STATUS_LABELS } from "@/constants";
import { usePointFaqList } from "@/hooks/usePointFaqList";

import { getPointFaqColumns } from "./PointFaqColumns";
import { PointFaqDialog } from "./PointFaqDialog";

import type { PointFaq } from "./types";

export function PointFaqTab() {
  const {
    faqs,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = usePointFaqList();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleEdit = (faq: PointFaq) => {
    setEditId(faq.id);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setDialogOpen(true);
  };

  const columns = useMemo(
    () => getPointFaqColumns({ onEdit: handleEdit, onDelete: handleDeleteClick }),
    [handleDeleteClick],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Point FAQ</p>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ асуулт
        </Button>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Асуулт хайх..."
        resultCount={totalCount ?? faqs.length}
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
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={faqs}
        isLoading={isLoading}
        onRowClick={(row) => handleEdit(row)}
        emptyTitle="Point FAQ байхгүй"
        emptyDescription="Point-тай холбоотой түгээмэл асуултууд нэмж эхэлнэ үү"
        emptyIcon={HelpCircle}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <PointFaqDialog open={dialogOpen} onOpenChange={setDialogOpen} editId={editId} />

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
