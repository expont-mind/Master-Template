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
import { CreditCard } from "lucide-react";
import {
  TRANSACTION_STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS,
} from "@/constants";
import { usePaymentList } from "@/hooks/usePaymentList";
import { getColumns } from "./columns";

export function PaymentList() {
  const router = useRouter();
  const {
    filteredPayments,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    providers,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = usePaymentList();

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Төлбөр</p>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Төлбөр хайх (ID, гүйлгээний дугаар, хэрэглэгч)..."
        resultCount={totalCount ?? filteredPayments.length}
        resultLabel="төлбөр"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {Object.entries(TRANSACTION_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Төлбөрийн хэрэгсэл" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {PAYMENT_PROVIDER_LABELS[
                  provider as keyof typeof PAYMENT_PROVIDER_LABELS
                ] || provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/payments/${row.id}`)}
        emptyTitle="Төлбөр байхгүй"
        emptyDescription="Төлбөрийн мэдээлэл байхгүй байна"
        emptyIcon={CreditCard}
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
