"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { PaymentDetails } from "@/components/payment/types";
import type { TransactionStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function usePaymentEdit(id: string) {
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TransactionStatus>("pending");

  const { data: payment = null, isLoading } = useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () =>
      adminApi.getById<PaymentDetails>("payments", id, {
        select:
          "id, order_id, provider, amount, status, transaction_ref, created_at, updated_at, orders(id, user_id, status, total_amount, payment_status, created_at, users(id, first_name, last_name, email, primary_phone), order_items(id, product_id, quantity, price, products(id, name)))",
      }),
  });

  useEffect(() => {
    if (payment) {
      setStatus(payment.status);
    }
  }, [payment]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminApi.update("payments", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
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
      setError(translateServerError(err instanceof Error ? err.message : "", "Төлбөр хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = payment && status !== payment.status;

  return {
    payment,
    isLoading,
    isSaving,
    error,
    status,
    hasChanges,
    setStatus,
    handleSave,
  };
}
