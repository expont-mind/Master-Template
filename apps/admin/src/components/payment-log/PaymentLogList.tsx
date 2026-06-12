"use client";

import { ScrollText } from "lucide-react";
import { useMemo } from "react";

import { DataTable, DataTableToolbar, DataTablePagination } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaymentLogList } from "@/hooks/usePaymentLogList";

import { getColumns } from "./columns";

export function PaymentLogList() {
  const {
    logs,
    isLoading,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = usePaymentLogList();

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold tracking-tight">Төлбөрийн лог</p>
          <p className="text-muted-foreground text-sm mt-1">
            Төлбөрийн callback, RPC алдаа, амжилттай баталгаажилтын бүртгэл
          </p>
        </div>
      </div>

      <DataTableToolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Лог хайх..."
        resultCount={totalCount ?? logs.length}
        resultLabel="лог"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            <SelectItem value="error">Алдаа</SelectItem>
            <SelectItem value="success">Амжилттай</SelectItem>
            <SelectItem value="info">Мэдээлэл</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            <SelectItem value="qpay">QPay</SelectItem>
            <SelectItem value="lendmn">LendMN</SelectItem>
            <SelectItem value="storepay">StorePay</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyTitle="Лог байхгүй"
        emptyDescription="Төлбөрийн лог бүртгэгдээгүй байна"
        emptyIcon={ScrollText}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
