"use client";

import { Loader2 } from "lucide-react";

import { usePolicies } from "@/hooks/usePolicies";

import { PolicyCard } from "./PolicyCard";
import { policyTypes } from "./types";

export function PolicyList() {
  const { isLoading, savingType, getPolicyByType, savePolicy, toggleActive } = usePolicies();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Нөхцөл, журам</h1>

      <div className="space-y-4">
        {policyTypes.map((policyType) => (
          <PolicyCard
            key={policyType.value}
            policyType={policyType}
            policy={getPolicyByType(policyType.value)}
            isSaving={savingType === policyType.value}
            onSave={(content) => savePolicy(policyType.value, content)}
            onToggleActive={() => toggleActive(policyType.value)}
          />
        ))}
      </div>
    </div>
  );
}
