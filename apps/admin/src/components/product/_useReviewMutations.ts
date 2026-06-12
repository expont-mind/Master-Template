"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { ReviewStatus } from "@/types/database";

interface AddParams {
  name: string;
  rating: number;
  comment: string | null;
  date: Date;
  images: string[];
}

interface EditParams {
  reviewId: string;
  userId: string;
  name: string;
  rating: number;
  comment: string | null;
  date: Date;
  images: string[];
}

interface UseReviewMutationsInput {
  productId: string;
  onAddSuccess: () => void;
  onAddError: (msg: string) => void;
  onEditSuccess: () => void;
  onEditError: (msg: string) => void;
}

export function useReviewMutations({
  productId,
  onAddSuccess,
  onAddError,
  onEditSuccess,
  onEditError,
}: UseReviewMutationsInput) {
  const queryClient = useQueryClient();

  const insertMutation = useMutation({
    mutationFn: async (params: AddParams) => {
      const userId = crypto.randomUUID();
      const email = `review-${userId.slice(0, 8)}@admin.local`;
      await adminApi.insert("users", {
        id: userId,
        email,
        first_name: params.name,
        status: "active",
      });
      await adminApi.insert("reviews", {
        user_id: userId,
        product_id: productId,
        rating: params.rating,
        comment: params.comment,
        images: params.images.length > 0 ? params.images : null,
        status: "active",
        created_at: params.date.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      onAddSuccess();
    },
    onError: (err) => {
      onAddError(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const editMutation = useMutation({
    mutationFn: async (params: EditParams) => {
      await adminApi.update("users", params.userId, {
        first_name: params.name,
      });
      await adminApi.update("reviews", params.reviewId, {
        rating: params.rating,
        comment: params.comment,
        images: params.images.length > 0 ? params.images : null,
        created_at: params.date.toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      onEditSuccess();
    },
    onError: (err) => {
      onEditError(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      adminApi.update("reviews", id, {
        status,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("reviews", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });

  return { insertMutation, editMutation, updateMutation, deleteMutation };
}
