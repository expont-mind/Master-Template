"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { User, UserOrder } from "@/components/user/types";
import type { UserStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useUserEdit(id: string) {
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>("active");

  const { data: user = null, isLoading: isLoadingUser } = useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () =>
      adminApi.getById<User>("users", id, {
        select: "id, email, first_name, last_name, primary_phone, avatar_url, status, created_at, updated_at, point_activated_at, addresses(id, city, district, sub_district, detail, is_default)",
      }),
  });

  const { data: pointTransactions = [] } = useQuery({
    queryKey: [...queryKeys.users.detail(id), "point_transactions"],
    queryFn: () =>
      adminApi.getAll<{ type: string; amount: number }>(
        "point_transactions",
        {
          select: "type, amount",
          filters: { "user_id.eq": id },
        },
      ),
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: [...queryKeys.orders.all, "user", id],
    queryFn: () =>
      adminApi.getAll<UserOrder>("orders", {
        select: "id, order_number, status, total_amount, payment_status, created_at",
        filters: { "user_id.eq": id },
        order: "created_at.desc",
        limit: 20,
      }),
  });

  useEffect(() => {
    if (user) {
      setStatus(user.status);
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminApi.update("users", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await saveMutation.mutateAsync({
        status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Хэрэглэгчийн мэдээлэл хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = user ? status !== user.status : false;

  const totalSpent = orders.reduce((sum, order) => {
    if (order.payment_status === "paid") {
      return sum + order.total_amount;
    }
    return sum;
  }, 0);

  const pointBalance = pointTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPointsUsed = pointTransactions
    .filter((t) => t.type === "used")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalPointsEarned = pointTransactions
    .filter((t) => t.type === "earned" || t.type === "promotional")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    user,
    orders,
    isLoading: isLoadingUser || isLoadingOrders,
    isSaving,
    error,
    status,
    setStatus,
    handleSave,
    hasChanges,
    totalSpent,
    pointBalance,
    totalPointsUsed,
    totalPointsEarned,
  };
}
