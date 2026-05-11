"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { ReviewWithDetails } from "@/components/review/types";
import type { ReviewStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useReviewEdit(id: string) {
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("active");

  const { data: review = null, isLoading } = useQuery({
    queryKey: queryKeys.reviews.detail(id),
    queryFn: () =>
      adminApi.getById<ReviewWithDetails>("reviews", id, {
        select:
          "id, user_id, product_id, rating, comment, status, created_at, updated_at, users(id, first_name, last_name, email, avatar_url), products(id, name, price, product_images(url, is_primary))",
      }),
  });

  useEffect(() => {
    if (review) {
      setStatus(review.status);
    }
  }, [review]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminApi.update("reviews", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await saveMutation.mutateAsync({
        status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Сэтгэгдэл хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = review ? status !== review.status : false;

  const getProductImage = () => {
    if (!review?.products?.product_images?.length) return null;
    const primary = review.products.product_images.find(
      (img) => img.is_primary
    );
    return primary?.url || review.products.product_images[0]?.url;
  };

  return {
    review,
    isLoading,
    isSaving,
    error,
    status,
    setStatus,
    handleSave,
    hasChanges,
    getProductImage,
  };
}
