"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { Policy, policyTypes } from "@/components/policy/types";
import { queryKeys } from "@/lib/query-keys";

export function usePolicies() {
  const queryClient = useQueryClient();

  const [savingType, setSavingType] = useState<string | null>(null);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: queryKeys.policies.lists(),
    queryFn: () =>
      adminApi.getAll<Policy>("policies", {
        order: "sort_order.asc",
      }),
  });

  const getPolicyByType = (type: string): Policy | null => {
    return policies.find((p) => p.type === type) || null;
  };

  const savePolicyMutation = useMutation({
    mutationFn: async ({ type, content }: { type: string; content: string }) => {
      const existing = getPolicyByType(type);
      const policyType = policyTypes.find((p) => p.value === type);
      const trimmedContent = content.trim();

      if (existing) {
        if (trimmedContent === "") {
          await adminApi.update("policies", existing.id, {
            content: "",
            is_active: false,
          });
        } else {
          await adminApi.update("policies", existing.id, { content: trimmedContent });
        }
      } else if (trimmedContent !== "") {
        await adminApi.insert<Policy>("policies", {
          type,
          title: policyType?.label || type,
          slug: type.replace(/_/g, "-"),
          content: trimmedContent,
          sort_order: policies.length,
          is_active: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (type: string) => {
      const policy = getPolicyByType(type);
      if (!policy) return;
      await adminApi.update("policies", policy.id, {
        is_active: !policy.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });

  const savePolicy = async (type: string, content: string) => {
    setSavingType(type);
    try {
      await savePolicyMutation.mutateAsync({ type, content });
    } catch (error) {
      log.error("policy_save_failed", error);
    }
    setSavingType(null);
  };

  const toggleActive = async (type: string) => {
    try {
      await toggleActiveMutation.mutateAsync(type);
    } catch (error) {
      log.error("policy_toggle_failed", error);
    }
  };

  return {
    policies,
    isLoading,
    savingType,
    getPolicyByType,
    savePolicy,
    toggleActive,
  };
}
