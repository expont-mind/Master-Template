"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { queryKeys } from "@/lib/query-keys";

import { buildFilters, type FilteredUser, type PointFilter, type StatusFilter } from "./_types";

const BATCH_SIZE = 50;

type MutationResult = {
  successCount: number;
  failedCount: number;
  firstError: string;
};

async function bulkInsertPointTransactions(
  userIds: string[],
  amount: number,
  description: string,
): Promise<MutationResult> {
  let successCount = 0;
  let failedCount = 0;
  let firstError = "";

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE).map((id) => ({
      user_id: id,
      type: "promotional" as const,
      amount,
      description,
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

  return { successCount, failedCount, firstError };
}

export function useMassPointShare(open: boolean, onClose: () => void) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear wizard state every time the modal closes
    if (!open) reset();
  }, [open, reset]);

  const filters = buildFilters(pointFilter, statusFilter);

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

  const clearConfirm = useCallback(() => setConfirming(false), []);
  const clearPreview = useCallback(() => setPreviewUsers(null), []);

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
    mutationFn: async (params: { amount: number; description: string }) => {
      let users: { id: string }[];
      try {
        users = await adminApi.getAllBatched<{ id: string }>("users", {
          select: "id",
          filters,
        });
      } catch (err) {
        throw new Error(
          `Хэрэглэгчдийн жагсаалт татахад алдаа: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (users.length === 0) {
        throw new Error("Шүүлтүүрт тохирох хэрэглэгч олдсонгүй");
      }

      const result = await bulkInsertPointTransactions(
        users.map((u) => u.id),
        params.amount,
        params.description,
      );

      if (result.successCount === 0) {
        throw new Error(`Бүх хэрэглэгчид point өгөхөд алдаа: ${result.firstError}`);
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTransactions.all });
      if (result.failedCount > 0) {
        setError(
          `${result.successCount} амжилттай, ${result.failedCount} амжилтгүй. Алдаа: ${result.firstError}`,
        );
        setConfirming(false);
      } else {
        onClose();
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setConfirming(false);
    },
  });

  const validateInput = (): { numAmount: number; trimmedDescription: string } | null => {
    if (matchCount === 0) {
      setError("Шүүлтүүрт тохирох хэрэглэгч олдсонгүй");
      return null;
    }
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Зөв дүн оруулна уу");
      return null;
    }
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError("Тайлбар оруулна уу");
      return null;
    }
    return { numAmount, trimmedDescription };
  };

  const handleSubmit = () => {
    setError(null);
    const valid = validateInput();
    if (!valid) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    mutation.mutate({ amount: valid.numAmount, description: valid.trimmedDescription });
  };

  return {
    pointFilter,
    setPointFilter,
    statusFilter,
    setStatusFilter,
    amount,
    setAmount,
    description,
    setDescription,
    error,
    confirming,
    previewUsers,
    isLoadingPreview,
    isCounting,
    matchCount,
    mutationPending: mutation.isPending,
    clearConfirm,
    clearPreview,
    handlePreview,
    handleSubmit,
  };
}

export type MassPointShareState = ReturnType<typeof useMassPointShare>;
