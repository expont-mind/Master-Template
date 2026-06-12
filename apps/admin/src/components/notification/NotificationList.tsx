"use client";

import { Bell } from "lucide-react";
import { useMemo, useState, useCallback } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTablePagination } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTIFICATION_TYPE_LABELS } from "@/constants";
import { useNotificationList } from "@/hooks/useNotificationList";

import { getColumns } from "./columns";

import type { Notification } from "./types";

export function NotificationList() {
  const {
    filteredNotifications,
    isLoading,
    typeFilter,
    setTypeFilter,
    readFilter,
    setReadFilter,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useNotificationList();

  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const onDelete = useCallback((notification: Notification) => {
    setDeleteTarget(notification);
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
        <p className="text-3xl font-bold tracking-tight">Мэдэгдэл</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Төрөл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх төрөл</SelectItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Унших төлөв" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="read">Уншсан</SelectItem>
              <SelectItem value="unread">Уншаагүй</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">{filteredNotifications.length} мэдэгдэл</div>
      </div>

      <DataTable
        columns={columns}
        data={filteredNotifications}
        isLoading={isLoading}
        emptyTitle="Мэдэгдэл байхгүй"
        emptyDescription="Мэдэгдэл алга байна"
        emptyIcon={Bell}
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
        title="Мэдэгдэл устгах"
        description="Энэ мэдэгдлийг устгахдаа итгэлтэй байна уу?"
        confirmText="Устгах"
        cancelText="Цуцлах"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
