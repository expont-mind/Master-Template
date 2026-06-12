"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { BankAccount, BankAccountFormData } from "@/components/bank-account/types";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

const defaultFormData: BankAccountFormData = {
  bank_name: "",
  account_name: "",
  account_number: "",
  currency: "MNT",
  is_default: false,
  is_active: true,
  logo_url: null,
  sort_order: 0,
};

export function useBankAccounts() {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BankAccountFormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: queryKeys.bankAccounts.lists(),
    queryFn: () =>
      adminApi.getAll<BankAccount>("bank_accounts", {
        order: "sort_order.asc",
        limit: 100,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      editingId,
      formData,
    }: {
      editingId: string;
      formData: BankAccountFormData;
    }) => {
      if (editingId === "new") {
        return adminApi.insert<BankAccount>("bank_accounts", formData);
      } else {
        return adminApi.update("bank_accounts", editingId, {
          ...formData,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("bank_accounts", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.update("bank_accounts", id, {
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await Promise.all(
        bankAccounts
          .filter((a) => a.is_default)
          .map((a) => adminApi.update("bank_accounts", a.id, { is_default: false })),
      );
      await adminApi.update("bank_accounts", id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });

  const startEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
      currency: account.currency,
      is_default: account.is_default,
      is_active: account.is_active,
      logo_url: account.logo_url,
      sort_order: account.sort_order,
    });
  };

  const startNew = () => {
    setEditingId("new");
    setFormData(defaultFormData);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setError(null);
  };

  const updateFormData = (updates: Partial<BankAccountFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.bank_name.trim()) {
      setError("Банкны нэрийг заавал оруулна уу.");
      return;
    }
    if (!formData.account_name.trim()) {
      setError("Дансны нэрийг заавал оруулна уу.");
      return;
    }
    if (!formData.account_number.trim()) {
      setError("Дансны дугаарыг заавал оруулна уу.");
      return;
    }

    setError(null);

    try {
      await saveMutation.mutateAsync({ editingId: editingId!, formData });
      cancelEdit();
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Данс хадгалахад алдаа гарлаа.",
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      log.error("bank_account_delete_failed", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ id, isActive });
    } catch (error) {
      log.error("bank_account_toggle_failed", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
    } catch (error) {
      log.error("bank_account_set_default_failed", error);
    }
  };

  return {
    bankAccounts,
    isLoading,
    isSaving: saveMutation.isPending,
    editingId,
    formData,
    error,
    startEdit,
    startNew,
    cancelEdit,
    updateFormData,
    handleSave,
    handleDelete,
    handleToggleActive,
    handleSetDefault,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all }),
  };
}
