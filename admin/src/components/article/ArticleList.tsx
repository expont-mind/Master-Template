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
import { Plus, FileText } from "lucide-react";
import { CONTENT_STATUS_LABELS } from "@/constants";
import { useArticleList } from "@/hooks/useArticleList";
import { getColumns } from "./columns";
import type { Article } from "./types";

export function ArticleList() {
  const router = useRouter();
  const {
    filteredArticles,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteId,
    setDeleteId,
    isDeleting,
    handleDelete,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = useArticleList();

  const onDelete = useCallback(
    (article: Article) => setDeleteId(article.id),
    [setDeleteId]
  );

  const columns = useMemo(
    () => getColumns({ onDelete }),
    [onDelete]
  );

  const deleteArticle = filteredArticles.find((a) => a.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">Нийтлэл</p>
        <Link href="/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ нийтлэл
          </Button>
        </Link>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Нийтлэл хайх..."
        resultCount={totalCount ?? filteredArticles.length}
        resultLabel="нийтлэл"
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
        data={filteredArticles}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/articles/${row.id}`)}
        emptyTitle="Нийтлэл байхгүй"
        emptyDescription="Эхний нийтлэлээ үүсгэнэ үү"
        emptyIcon={FileText}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Нийтлэл устгах"
        description={
          deleteArticle
            ? `"${deleteArticle.title}" нийтлэлийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`
            : "Та энэ нийтлэлийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй."
        }
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
