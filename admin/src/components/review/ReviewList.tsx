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
import { MessageSquare } from "lucide-react";
import { REVIEW_STATUS_LABELS } from "@/constants";
import { useReviewList } from "@/hooks/useReviewList";
import { getColumns } from "./columns";

export function ReviewList() {
  const router = useRouter();
  const {
    filteredReviews,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    ratingFilter,
    setRatingFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useReviewList();

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Сэтгэгдэл</p>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Хэрэглэгч, бүтээгдэхүүн, сэтгэгдэл хайх..."
        resultCount={totalCount ?? filteredReviews.length}
        resultLabel="сэтгэгдэл"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {Object.entries(REVIEW_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Үнэлгээ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх үнэлгээ</SelectItem>
            <SelectItem value="5">5 од</SelectItem>
            <SelectItem value="4">4 од</SelectItem>
            <SelectItem value="3">3 од</SelectItem>
            <SelectItem value="2">2 од</SelectItem>
            <SelectItem value="1">1 од</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>

      <DataTable
        columns={columns}
        data={filteredReviews}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/reviews/${row.id}`)}
        emptyTitle="Сэтгэгдэл байхгүй"
        emptyDescription="Одоогоор сэтгэгдэл бүртгэгдээгүй байна"
        emptyIcon={MessageSquare}
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
