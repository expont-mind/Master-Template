"use client";

import { Plus, Coins, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable, DataTableToolbar, DataTablePagination } from "@/components/ui/data-table";
import { usePointShare } from "@/hooks/usePointShare";

import { MassPointShareDialog } from "./MassPointShareDialog";
import { PointShareDialog } from "./PointShareDialog";
import { getPointTransactionColumns } from "./PointTransactionColumns";

export function PointShareTab() {
  const {
    transactions,
    isLoading,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
  } = usePointShare();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [massDialogOpen, setMassDialogOpen] = useState(false);
  const columns = useMemo(() => getPointTransactionColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Point гүйлгээнүүд</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMassDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Mass Point
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Point өгөх
          </Button>
        </div>
      </div>

      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Хэрэглэгч хайх..."
        resultCount={totalCount ?? transactions.length}
        resultLabel="гүйлгээ"
      />

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        emptyTitle="Гүйлгээ байхгүй"
        emptyDescription="Point өгсөн гүйлгээ хараахан алга байна"
        emptyIcon={Coins}
      />

      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <PointShareDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <MassPointShareDialog open={massDialogOpen} onOpenChange={setMassDialogOpen} />
    </div>
  );
}
