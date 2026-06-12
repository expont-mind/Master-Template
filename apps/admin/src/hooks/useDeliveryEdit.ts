"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { DeliveryZone } from "@/components/delivery/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useDeliveryEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null);
  const [isFreeDeliveryEnabled, setIsFreeDeliveryEnabled] = useState(false);
  const [estimatedDaysMin, setEstimatedDaysMin] = useState(1);
  const [estimatedDaysMax, setEstimatedDaysMax] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const { data: currentZone = null } = useQuery({
    queryKey: queryKeys.deliveryZones.detail(id),
    queryFn: () =>
      adminApi.getById<DeliveryZone>("delivery_zones", id, {
        select:
          "id, name, description, delivery_fee, free_delivery_threshold, is_free_delivery_enabled, estimated_days_min, estimated_days_max, is_active, sort_order, created_at, updated_at",
      }),
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew) return;
    if (currentZone) {
      // Intentional one-time form prefill from Supabase fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(currentZone.name);
      setDescription(currentZone.description || "");
      setDeliveryFee(currentZone.delivery_fee);
      setFreeDeliveryThreshold(currentZone.free_delivery_threshold);
      setIsFreeDeliveryEnabled(currentZone.is_free_delivery_enabled);
      setEstimatedDaysMin(currentZone.estimated_days_min);
      setEstimatedDaysMax(currentZone.estimated_days_max);
      setIsActive(currentZone.is_active);
      setSortOrder(currentZone.sort_order);
    }
  }, [currentZone, isNew]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? adminApi.insert("delivery_zones", data) : adminApi.update("delivery_zones", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryZones.all });
      router.push("/deliveries");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Хүргэлтийн бүсийн нэрийг заавал оруулна уу.");
      }

      await saveMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        delivery_fee: deliveryFee,
        free_delivery_threshold: isFreeDeliveryEnabled ? freeDeliveryThreshold : null,
        is_free_delivery_enabled: isFreeDeliveryEnabled,
        estimated_days_min: estimatedDaysMin,
        estimated_days_max: estimatedDaysMax,
        is_active: isActive,
        sort_order: sortOrder,
      });
    } catch (err) {
      const errorMessage = translateServerError(
        err instanceof Error ? err.message : "",
        "Хүргэлтийн бүс хадгалахад алдаа гарлаа.",
      );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isNew,
    isLoading,
    error,
    currentZone,
    name,
    description,
    deliveryFee,
    freeDeliveryThreshold,
    isFreeDeliveryEnabled,
    estimatedDaysMin,
    estimatedDaysMax,
    isActive,
    sortOrder,
    setName,
    setDescription,
    setDeliveryFee,
    setFreeDeliveryThreshold,
    setIsFreeDeliveryEnabled,
    setEstimatedDaysMin,
    setEstimatedDaysMax,
    setIsActive,
    setSortOrder,
    handleSubmit,
  };
}
