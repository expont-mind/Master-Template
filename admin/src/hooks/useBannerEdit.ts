"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Banner, BannerFormData } from "@/components/banner/types";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

const defaultFormData: BannerFormData = {
  image_url: "",
  mobile_image_url: null,
  background_color: "#ffffff",
  mobile_background_color: null,
  category_id: null,
  product_id: null,
  link_url: null,
  type: "carousel",
  sort_order: 0,
  is_active: true,
};

interface ReferenceItem {
  id: string;
  name: string;
}

export function useBannerEdit(id?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  const { data: banner = null, isLoading } = useQuery({
    queryKey: queryKeys.banners.detail(id!),
    queryFn: () => adminApi.getById<Banner>("banners", id!),
    enabled: isEditMode,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["reference", "categories"],
    queryFn: () =>
      adminApi.getAll<ReferenceItem>("categories", {
        select: "id, name",
        order: "name.asc",
      }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["reference", "products"],
    queryFn: () =>
      adminApi.getAll<ReferenceItem>("products", {
        select: "id, name",
        order: "name.asc",
        limit: 100,
      }),
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        image_url: banner.image_url,
        mobile_image_url: banner.mobile_image_url,
        background_color: banner.background_color || "#ffffff",
        mobile_background_color: banner.mobile_background_color,
        category_id: banner.category_id,
        product_id: banner.product_id,
        link_url: banner.link_url,
        type: banner.type || "carousel",
        sort_order: banner.sort_order,
        is_active: banner.is_active,
      });
    }
  }, [banner]);

  const updateFormData = (updates: Partial<BannerFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditMode && id
        ? adminApi.update("banners", id, data)
        : adminApi.insert("banners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
      router.push("/banners");
    },
  });

  const handleSave = async () => {
    if (!formData.image_url.trim()) {
      setError("Баннерын зураг заавал оруулна уу.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await saveMutation.mutateAsync({
          ...formData,
          updated_at: new Date().toISOString(),
        });
      } else {
        await saveMutation.mutateAsync(formData);
      }
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Баннер хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    banner,
    formData,
    categories,
    products,
    isLoading,
    isSaving,
    error,
    isEditMode,
    updateFormData,
    handleSave,
  };
}
