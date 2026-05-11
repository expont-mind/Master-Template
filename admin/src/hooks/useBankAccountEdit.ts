"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { BankAccount } from "@/components/bank-account/types";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useBankAccountEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("MNT");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const { data: account = null, isLoading } = useQuery({
    queryKey: queryKeys.bankAccounts.detail(id),
    queryFn: () => adminApi.getById<BankAccount>("bank_accounts", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (account) {
      setBankName(account.bank_name);
      setAccountName(account.account_name);
      setAccountNumber(account.account_number);
      setCurrency(account.currency);
      setIsActive(account.is_active);
      setIsDefault(account.is_default);
    }
  }, [account]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew
        ? adminApi.insert<BankAccount>("bank_accounts", data)
        : adminApi.update<BankAccount>("bank_accounts", id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
      if (isNew && result && typeof result === "object" && "id" in result) {
        router.push(`/bank-accounts/${(result as { id: string }).id}`);
      }
    },
  });

  const handleSave = async () => {
    if (!bankName.trim()) {
      setError("Банкны нэрийг заавал оруулна уу.");
      return;
    }
    if (!accountName.trim()) {
      setError("Дансны нэрийг заавал оруулна уу.");
      return;
    }
    if (!accountNumber.trim()) {
      setError("Дансны дугаарыг заавал оруулна уу.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const accountData = {
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        currency,
        is_active: isActive,
        is_default: isDefault,
      };

      await saveMutation.mutateAsync(accountData);
    } catch (error) {
      setError(translateServerError(error instanceof Error ? error.message : "", "Данс хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isNew,
    account,
    isLoading,
    isSaving,
    error,
    bankName,
    setBankName,
    accountName,
    setAccountName,
    accountNumber,
    setAccountNumber,
    currency,
    setCurrency,
    isActive,
    setIsActive,
    isDefault,
    setIsDefault,
    handleSave,
  };
}
