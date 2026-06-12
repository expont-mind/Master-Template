"use client";

import { Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useCallback } from "react";

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
import { SMS_STATUS_LABELS } from "@/constants";
import { useSmsCampaignList } from "@/hooks/useSmsCampaignList";

import { getColumns } from "./columns";

import type { SmsCampaign } from "./types";

export function SmsCampaignList() {
  const {
    campaigns,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useSmsCampaignList();

  const [deleteTarget, setDeleteTarget] = useState<SmsCampaign | null>(null);

  const onDelete = useCallback((campaign: SmsCampaign) => {
    setDeleteTarget(campaign);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleDelete]);

  const columns = useMemo(() => getColumns({ onDelete }), [onDelete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">SMS кампанит ажил</p>
        <Link href="/sms-campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ SMS
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Кампани хайх..."
        resultCount={totalCount ?? campaigns.length}
        resultLabel="кампани"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {Object.entries(SMS_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        emptyTitle="SMS кампани байхгүй"
        emptyDescription="Эхний кампанийг үүсгэнэ үү"
        emptyIcon={MessageSquare}
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
        title="Кампани устгах"
        description={`"${deleteTarget?.name}" кампанийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.`}
        confirmText="Устгах"
        cancelText="Цуцлах"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
