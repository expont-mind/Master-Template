"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Brand } from "@/components/brand/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useBrandEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: currentBrand = null } = useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () =>
      adminApi.getById<Brand>("brands", id, {
        select: "id, name, logo_url",
      }),
  });

  useEffect(() => {
    if (currentBrand) {
      // Intentional one-time form prefill from Supabase fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(currentBrand.name);
      setLogoUrl(currentBrand.logo_url || "");
    }
  }, [currentBrand]);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; logo_url: string | null }) =>
      adminApi.update("brands", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
      router.push("/brands");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error("Брэндийн нэр оруулна уу");
      }

      if (!logoUrl) {
        throw new Error("Брэндийн лого оруулна уу");
      }

      // Generate slug from name
      const baseSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");

      // If slug is empty (e.g., all Mongolian text), generate a random one
      const slug =
        baseSlug || `brand-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

      await saveMutation.mutateAsync({
        name: name.trim(),
        slug,
        logo_url: logoUrl,
      });
    } catch (err) {
      const errorMessage = translateServerError(
        err instanceof Error ? err.message : "",
        "Брэнд хадгалахад алдаа гарлаа.",
      );
      setError(errorMessage);
    }
  };

  return {
    isLoading: saveMutation.isPending,
    error,
    currentBrand,
    name,
    logoUrl,
    setName,
    setLogoUrl,
    handleSubmit,
  };
}
