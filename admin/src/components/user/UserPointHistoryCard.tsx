"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCell, DateCell } from "@/components/ui/data-table";
import { Coins, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { POINT_TYPE_LABELS, POINT_TYPE_COLORS } from "@/constants";
import { UserPointManageDialog } from "./UserPointManageDialog";

interface PointTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface UserPointHistoryCardProps {
  userId: string;
  userName: string;
}

const PAGE_SIZE = 10;

export function UserPointHistoryCard({
  userId,
  userName,
}: UserPointHistoryCardProps) {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.pointTransactions.userBalance(userId), "history", page],
    queryFn: () =>
      adminApi.getAllPaginated<PointTransaction>("point_transactions", {
        select: "id, type, amount, description, created_at",
        filters: { "user_id.eq": userId },
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const transactions = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5" />
            Point түүх
          </CardTitle>
          <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Point нэмэх/хасах
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Point гүйлгээ байхгүй
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Огноо</th>
                      <th className="pb-2 font-medium">Төрөл</th>
                      <th className="pb-2 font-medium text-right">Дүн</th>
                      <th className="pb-2 font-medium">Тайлбар</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2.5">
                          <DateCell value={tx.created_at} showTime />
                        </td>
                        <td className="py-2.5">
                          <BadgeCell
                            value={tx.type}
                            labels={POINT_TYPE_LABELS}
                            colors={POINT_TYPE_COLORS}
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`font-medium ${
                              tx.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {tx.amount >= 0 ? "+" : ""}
                            {tx.amount.toLocaleString()}P
                          </span>
                        </td>
                        <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">
                          {tx.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Нийт {totalCount} гүйлгээ
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UserPointManageDialog
        userId={userId}
        userName={userName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
