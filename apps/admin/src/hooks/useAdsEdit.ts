"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { Ad } from "@/components/ads/types";
import type { AdPosition } from "@/types/database";

function formatDateTimeForInput(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export function useAdsEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<AdPosition>("home");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: ad = null, isLoading } = useQuery({
    queryKey: queryKeys.ads.detail(id),
    queryFn: () => adminApi.getById<Ad>("ads", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (ad) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill form fields from saved ad after async fetch resolves
      setTitle(ad.title);
      setDescription(ad.description || "");
      setImageUrl(ad.image_url);
      setLinkUrl(ad.link_url || "");
      setPosition(ad.position);
      setIsActive(ad.is_active);
      setStartDate(formatDateTimeForInput(ad.start_date));
      setEndDate(formatDateTimeForInput(ad.end_date));
      setSortOrder(ad.sort_order);
    }
  }, [ad]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? adminApi.insert<Ad>("ads", data) : adminApi.update<Ad>("ads", id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
      if (isNew && result && typeof result === "object" && "id" in result) {
        router.push(`/ads/${(result as { id: string }).id}`);
      }
    },
  });

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Зарын гарчгийг заавал оруулна уу.");
      return;
    }

    if (!imageUrl.trim()) {
      setError("Зарын зураг заавал оруулна уу.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const adData = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim(),
        link_url: linkUrl.trim() || null,
        position,
        is_active: isActive,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        sort_order: sortOrder,
      };

      await saveMutation.mutateAsync(adData);
    } catch (error) {
      setError(
        translateServerError(
          error instanceof Error ? error.message : "",
          "Зар хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isNew,
    ad,
    isLoading,
    isSaving,
    error,
    title,
    setTitle,
    description,
    setDescription,
    imageUrl,
    setImageUrl,
    linkUrl,
    setLinkUrl,
    position,
    setPosition,
    isActive,
    setIsActive,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortOrder,
    setSortOrder,
    handleSave,
  };
}
