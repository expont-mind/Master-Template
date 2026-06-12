"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useBankAccountEdit } from "@/hooks/useBankAccountEdit";

import { BankAccountBasicCard } from "./BankAccountBasicCard";
import { BankAccountEditHeader } from "./BankAccountEditHeader";
import { BankAccountInfoCard } from "./BankAccountInfoCard";
import { BankAccountSettingsCard } from "./BankAccountSettingsCard";

interface BankAccountFormProps {
  id: string;
}

export function BankAccountForm({ id }: BankAccountFormProps) {
  const {
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
  } = useBankAccountEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !account) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Данс олдсонгүй</h3>
        <Link href="/bank-accounts">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BankAccountEditHeader
        isNew={isNew}
        bankName={bankName}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <BankAccountBasicCard
            bankName={bankName}
            onBankNameChange={setBankName}
            accountName={accountName}
            onAccountNameChange={setAccountName}
            accountNumber={accountNumber}
            onAccountNumberChange={setAccountNumber}
            currency={currency}
            onCurrencyChange={setCurrency}
          />
        </div>

        <div className="space-y-6">
          <BankAccountSettingsCard
            isActive={isActive}
            onIsActiveChange={setIsActive}
            isDefault={isDefault}
            onIsDefaultChange={setIsDefault}
          />
          {!isNew && account && <BankAccountInfoCard account={account} />}
        </div>
      </div>
    </div>
  );
}
