"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

interface Setting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  group_name: string;
  is_public: boolean;
}

const SETTING_KEY = "custom_option_types";

export function useCustomOptionTypes() {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: queryKeys.settings.byKey(SETTING_KEY),
    queryFn: () =>
      adminApi.getAll<Setting>("settings", {
        filters: { "key.eq": SETTING_KEY },
      }),
  });

  const existing = settings[0];
  const customTypes: string[] = existing ? (existing.value as string[]) || [] : [];

  const saveMutation = useMutation({
    mutationFn: async (newTypes: string[]) => {
      if (existing) {
        await adminApi.update("settings", existing.id, { value: newTypes });
      } else {
        await adminApi.insert("settings", {
          key: SETTING_KEY,
          value: newTypes,
          group_name: "product_options",
          is_public: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.byKey(SETTING_KEY),
      });
    },
  });

  const addCustomType = (type: string) => {
    const trimmed = type.trim();
    if (!trimmed || customTypes.includes(trimmed)) return;
    saveMutation.mutate([...customTypes, trimmed]);
  };

  return { customTypes, addCustomType };
}
