"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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

const SETTINGS_KEYS = ["brand_section_title", "brand_section_icon"] as const;

const DEFAULTS: Record<string, string> = {
  brand_section_title: "Брэндүүд",
  brand_section_icon: "/images/brand-icon.png",
};

export function useBrandSectionSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: queryKeys.settings.byKey("brand_section"),
    queryFn: () =>
      adminApi.getAll<Setting>("settings", {
        filters: { "key.in": SETTINGS_KEYS.join(",") },
      }),
  });

  const titleSetting = settings.find((s) => s.key === "brand_section_title");
  const iconSetting = settings.find((s) => s.key === "brand_section_icon");

  const [title, setTitle] = useState(DEFAULTS.brand_section_title);
  const [iconUrl, setIconUrl] = useState(DEFAULTS.brand_section_icon);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill local form state from saved settings after async fetch resolves
    if (titleSetting?.value) setTitle(titleSetting.value as string);
    if (iconSetting?.value) setIconUrl(iconSetting.value as string);
  }, [titleSetting, iconSetting]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const upsert = async (key: string, value: string, existing?: Setting) => {
        if (existing) {
          await adminApi.update("settings", existing.id, { value });
        } else {
          await adminApi.insert("settings", {
            key,
            value,
            group_name: "brand_section",
            is_public: true,
          });
        }
      };

      await Promise.all([
        upsert("brand_section_title", title, titleSetting),
        upsert("brand_section_icon", iconUrl, iconSetting),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.byKey("brand_section"),
      });
    },
  });

  const savedTitle = (titleSetting?.value as string) || DEFAULTS.brand_section_title;
  const savedIcon = (iconSetting?.value as string) || DEFAULTS.brand_section_icon;
  const hasChanges = title !== savedTitle || iconUrl !== savedIcon;

  return {
    title,
    setTitle,
    iconUrl,
    setIconUrl,
    isLoading,
    isSaving: saveMutation.isPending,
    hasChanges,
    save: saveMutation.mutateAsync,
    error: saveMutation.error?.message || null,
  };
}
