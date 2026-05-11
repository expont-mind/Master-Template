"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { log } from "@/lib/observability/log";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Coins,
  Users,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

interface MassPointShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PointFilter = "all" | "activated" | "not_activated";
type StatusFilter = "all" | "active" | "inactive" | "banned";

interface FilteredUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
}

function buildFilters(
  pointFilter: PointFilter,
  statusFilter: StatusFilter,
): Record<string, string> {
  const filters: Record<string, string> = {};

  if (pointFilter === "activated") {
    filters["point_activated_at.is"] = "not.null";
  } else if (pointFilter === "not_activated") {
    filters["point_activated_at.is"] = "null";
  }

  if (statusFilter !== "all") {
    filters["status.eq"] = statusFilter;
  }

  return filters;
}

function getUserName(user: FilteredUser): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email;
}

export function MassPointShareDialog({
  open,
  onOpenChange,
}: MassPointShareDialogProps) {
  const queryClient = useQueryClient();
  const [pointFilter, setPointFilter] = useState<PointFilter>("activated");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<FilteredUser[] | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const reset = useCallback(() => {
    setPointFilter("activated");
    setStatusFilter("active");
    setAmount("");
    setDescription("");
    setError(null);
    setConfirming(false);
    setPreviewUsers(null);
    setIsLoadingPreview(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const filters = buildFilters(pointFilter, statusFilter);

  // Fetch count of matching users
  const { data: matchResult, isLoading: isCounting } = useQuery({
    queryKey: ["massPointUsers", pointFilter, statusFilter],
    queryFn: () =>
      adminApi.getAllPaginated<FilteredUser>("users", {
        select: "id",
        filters,
        limit: 0,
        offset: 0,
      }),
    enabled: open,
    staleTime: 15_000,
  });

  const matchCount = matchResult?.totalCount ?? 0;

  // Preview: fetch matching users list
  const handlePreview = async () => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const users = await adminApi.getAll<FilteredUser>("users", {
        select: "id, first_name, last_name, email, primary_phone",
        filters,
        limit: 50,
      });
      setPreviewUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview алдаа");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (params: {
      amount: number;
      description: string;
    }) => {
      // Fetch all matching user IDs
      let users: { id: string }[];
      try {
        users = await adminApi.getAllBatched<{ id: string }>("users", {
          select: "id",
          filters,
        });
      } catch (err) {
        throw new Error(
          `Хэрэглэгчдийн жагсаалт татахад алдаа: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      if (users.length === 0) {
        throw new Error("Шүүлтүүрт тохирох хэрэглэгч олдсонгүй");
      }

      // Bulk insert in small batches (each insert triggers a notification
      // row via DB trigger, so effective DB ops = 2× batch size).
      const BATCH_SIZE = 50;
      let successCount = 0;
      let failedCount = 0;
      let firstError = "";

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE).map((user) => ({
          user_id: user.id,
          type: "promotional" as const,
          amount: params.amount,
          description: params.description,
        }));
        try {
          await adminApi.bulkInsert("point_transactions", batch);
          successCount += batch.length;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          log.error("mass_point_share_batch_failed", {
            from: i,
            to: i + batch.length,
            message: msg,
          });
          if (!firstError) firstError = msg;
          failedCount += batch.length;
        }
      }

      if (successCount === 0) {
        throw new Error(
          `Бүх хэрэглэгчид point өгөхөд алдаа: ${firstError}`
        );
      }

      return { successCount, failedCount, firstError };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pointTransactions.all,
      });
      if (result.failedCount > 0) {
        setError(
          `${result.successCount} амжилттай, ${result.failedCount} амжилтгүй. Алдаа: ${result.firstError}`
        );
        setConfirming(false);
      } else {
        onOpenChange(false);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setConfirming(false);
    },
  });

  const handleSubmit = () => {
    setError(null);

    if (matchCount === 0) {
      setError("Шүүлтүүрт тохирох хэрэглэгч олдсонгүй");
      return;
    }

    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Зөв дүн оруулна уу");
      return;
    }

    if (!description.trim()) {
      setError("Тайлбар оруулна уу");
      return;
    }

    if (!confirming) {
      setConfirming(true);
      return;
    }

    mutation.mutate({
      amount: numAmount,
      description: description.trim(),
    });
  };

  const clearConfirm = () => {
    setConfirming(false);
  };

  const pointFilterLabel: Record<PointFilter, string> = {
    all: "Бүгд",
    activated: "Point идэвхтэй",
    not_activated: "Point идэвхжүүлээгүй",
  };

  const statusFilterLabel: Record<StatusFilter, string> = {
    all: "Бүгд",
    active: "Идэвхтэй",
    inactive: "Идэвхгүй",
    banned: "Хориглосон",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mass Point өгөх
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Point төлөв</Label>
              <Select
                value={pointFilter}
                onValueChange={(v) => {
                  setPointFilter(v as PointFilter);
                  clearConfirm();
                  setPreviewUsers(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(pointFilterLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Хэрэглэгчийн төлөв</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter);
                  clearConfirm();
                  setPreviewUsers(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusFilterLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Match count + Preview button */}
          <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Тохирох хэрэглэгчид
              </span>
              {isCounting ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-sm font-semibold">
                  {matchCount.toLocaleString()}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={isCounting || matchCount === 0 || isLoadingPreview}
            >
              {isLoadingPreview ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="mr-1.5 h-3.5 w-3.5" />
              )}
              Харах
            </Button>
          </div>

          {/* Preview users list */}
          {previewUsers && previewUsers.length > 0 && (
            <div className="rounded-lg border bg-muted/20 max-h-[200px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      Нэр
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      Утас
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewUsers.map((user, i) => (
                    <tr key={user.id}>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-1.5 font-medium truncate max-w-[180px]">
                        {getUserName(user)}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {user.primary_phone || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matchCount > 50 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                  ... болон бусад {(matchCount - 50).toLocaleString()}{" "}
                  хэрэглэгч
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="mass-point-amount">Дүн (хэрэглэгч бүрт)</Label>
            <div className="relative">
              <Input
                id="mass-point-amount"
                type="number"
                min="1"
                placeholder="10,000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  clearConfirm();
                }}
                className="pr-14"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
                <Coins className="size-3.5" />
                <span className="text-xs font-medium">MP</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="mass-point-description">Тайлбар</Label>
            <Textarea
              id="mass-point-description"
              placeholder="Урамшуулал, бонус гэх мэт..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearConfirm();
              }}
              rows={3}
            />
          </div>

          {/* Summary */}
          {matchCount > 0 && amount && parseInt(amount) > 0 && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <span className="font-medium">
                {matchCount.toLocaleString()}
              </span>{" "}
              хэрэглэгчид тус бүрт{" "}
              <span className="font-medium">
                {parseInt(amount).toLocaleString()}
              </span>{" "}
              MP, нийт{" "}
              <span className="font-semibold">
                {(matchCount * parseInt(amount)).toLocaleString()}
              </span>{" "}
              MP өгнө
            </div>
          )}

          {/* Confirm warning */}
          {confirming && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">
                  {matchCount.toLocaleString()}
                </span>{" "}
                хэрэглэгчид point өгөх гэж байна. Итгэлтэй бол дахин дарна
                уу.
              </span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Болих
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || isCounting || matchCount === 0}
            variant={confirming ? "destructive" : "default"}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {confirming
              ? "Баталгаажуулах"
              : matchCount > 0
                ? `${matchCount.toLocaleString()} хэрэглэгчид өгөх`
                : "Өгөх"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
