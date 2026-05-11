"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Users } from "lucide-react";
import { USER_STATUS_LABELS } from "@/constants";
import { useUserList } from "@/hooks/useUserList";
import { getColumns } from "./columns";
import { UserAnalyticsSection } from "./UserAnalyticsSection";

export function UserList() {
  const router = useRouter();
  const {
    filteredUsers,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
    setPageSize,
  } = useUserList();

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Хэрэглэгчид</p>
      </div>

      <UserAnalyticsSection />

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Хэрэглэгч хайх (нэр, email, утас)..."
        resultCount={totalCount ?? filteredUsers.length}
        resultLabel="хэрэглэгч"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/users/${row.id}`)}
        emptyTitle="Хэрэглэгч байхгүй"
        emptyDescription="Бүртгэлтэй хэрэглэгч байхгүй байна"
        emptyIcon={Users}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
