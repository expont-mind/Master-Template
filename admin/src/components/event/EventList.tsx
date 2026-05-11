"use client";

import { useMemo, useCallback } from "react";
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
import { Plus, CalendarDays } from "lucide-react";
import { CONTENT_STATUS_LABELS } from "@/constants";
import { useEventList } from "@/hooks/useEventList";
import { getColumns } from "./columns";
import type { Event } from "./types";

export function EventList() {
  const router = useRouter();
  const {
    filteredEvents,
    isLoading,
    isDeleting,
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
  } = useEventList();

  const onDelete = useCallback(
    (event: Event) => setDeleteTarget(event),
    [setDeleteTarget]
  );

  const columns = useMemo(
    () => getColumns({ onDelete }),
    [onDelete]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Эвент</p>
        <Link href="/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ эвент
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Эвент хайх..."
        resultCount={totalCount ?? filteredEvents.length}
        resultLabel="эвент"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
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
        data={filteredEvents}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/events/${row.id}`)}
        emptyTitle="Эвент байхгүй"
        emptyDescription="Эхний эвентээ үүсгэнэ үү"
        emptyIcon={CalendarDays}
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
        title="Эвент устгах"
        description={`"${deleteTarget?.title}" эвентийг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
