"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { Branch } from "@/components/branch/types";

export function useBranchEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [weekdayHours, setWeekdayHours] = useState("");
  const [weekendHours, setWeekendHours] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const { data: branch = null, isLoading } = useQuery({
    queryKey: queryKeys.branches.detail(id),
    queryFn: () => adminApi.getById<Branch>("branches", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (branch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(branch.name);
      setAddress(branch.address || "");
      setPhone(branch.phone || "");
      setEmail(branch.email || "");
      setWeekdayHours(branch.weekday_hours || "");
      setWeekendHours(branch.weekend_hours || "");
      setGoogleMapsUrl(branch.google_maps_url || "");
      setImageUrl(branch.image_url || "");
      setSortOrder(branch.sort_order || 0);
      setIsActive(branch.is_active);
    }
  }, [branch]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew
        ? adminApi.insert<Branch>("branches", data)
        : adminApi.update<Branch>("branches", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      router.push("/branches");
    },
  });

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Салбарын нэрийг заавал оруулна уу.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const branchData = {
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        weekday_hours: weekdayHours.trim() || null,
        weekend_hours: weekendHours.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
        image_url: imageUrl || null,
        sort_order: sortOrder,
        is_active: isActive,
      };

      await saveMutation.mutateAsync(branchData);
    } catch (error) {
      setError(
        translateServerError(
          error instanceof Error ? error.message : "",
          "Салбар хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isNew,
    branch,
    isLoading,
    isSaving,
    error,
    name,
    setName,
    address,
    setAddress,
    phone,
    setPhone,
    email,
    setEmail,
    weekdayHours,
    setWeekdayHours,
    weekendHours,
    setWeekendHours,
    googleMapsUrl,
    setGoogleMapsUrl,
    imageUrl,
    setImageUrl,
    sortOrder,
    setSortOrder,
    isActive,
    setIsActive,
    handleSave,
  };
}
