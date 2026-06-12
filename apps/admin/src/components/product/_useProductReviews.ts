"use client";

// State and mutations for the ProductReviewsTab. Wraps the four review
// API calls (add / edit / toggle status / delete) and exposes the form
// state for both the Add and Edit dialogs.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useReviewAddForm, useReviewEditForm } from "./_useReviewForms";
import { useReviewMutations } from "./_useReviewMutations";

import type { ReviewStatus } from "@/types/database";

export interface ReviewWithImages {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  status: ReviewStatus;
  created_at: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

function getUserName(review: ReviewWithImages): string {
  if (!review.users) return "Хэрэглэгч";
  const name = [review.users.first_name, review.users.last_name].filter(Boolean).join(" ");
  return name || review.users.email || "Хэрэглэгч";
}

export function formatReviewDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function getReviewUserName(review: ReviewWithImages): string {
  return getUserName(review);
}

export function useProductReviews(productId: string) {
  const queryKey = queryKeys.reviews.lists({ productId });

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminApi.getAllPaginated<ReviewWithImages>("reviews", {
        select:
          "id, user_id, product_id, rating, comment, images, status, created_at, users(id, first_name, last_name, email)",
        order: "created_at.desc",
        filters: { "product_id.eq": productId },
        limit: 100,
      }),
  });

  const reviews = data?.data ?? [];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const addForm = useReviewAddForm();
  const editForm = useReviewEditForm();
  const { newRating, hoverRating, newComment, newName, newDate, newImages, addError } =
    addForm.state;
  const {
    setNewRating,
    setNewName,
    setNewComment,
    setNewDate,
    setNewImages,
    setAddError,
    setHoverRating,
  } = addForm.setters;
  const {
    editingReview,
    editRating,
    editHoverRating,
    editComment,
    editName,
    editDate,
    editImages,
    editError,
  } = editForm.state;
  const {
    setEditingReview,
    setEditRating,
    setEditHoverRating,
    setEditComment,
    setEditName,
    setEditDate,
    setEditImages,
    setEditError,
  } = editForm.setters;
  const resetAddForm = addForm.resetAddForm;

  const { insertMutation, editMutation, updateMutation, deleteMutation } = useReviewMutations({
    productId,
    onAddSuccess: () => {
      setIsAddOpen(false);
      resetAddForm();
    },
    onAddError: setAddError,
    onEditSuccess: () => setEditingReview(null),
    onEditError: setEditError,
  });

  const openEdit = (review: ReviewWithImages) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditHoverRating(0);
    setEditComment(review.comment || "");
    setEditName(getUserName(review));
    const d = new Date(review.created_at);
    setEditDate(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
    setEditImages(review.images || []);
    setEditError(null);
  };

  const handleAddReview = () => {
    if (newRating === 0 || !newName.trim()) return;
    setAddError(null);
    insertMutation.mutate({
      name: newName.trim(),
      rating: newRating,
      comment: newComment.trim() || null,
      date: newDate,
      images: newImages,
    });
  };

  const handleEditReview = () => {
    if (!editingReview || editRating === 0 || !editName.trim()) return;
    setEditError(null);
    editMutation.mutate({
      reviewId: editingReview.id,
      userId: editingReview.user_id,
      name: editName.trim(),
      rating: editRating,
      comment: editComment.trim() || null,
      date: editDate,
      images: editImages,
    });
  };

  const toggleStatus = (review: ReviewWithImages) => {
    const newStatus: ReviewStatus = review.status === "active" ? "hidden" : "active";
    updateMutation.mutate({ id: review.id, status: newStatus });
  };

  return {
    reviews,
    isLoading,
    isAddOpen,
    setIsAddOpen,
    resetAddForm,
    addForm: {
      newRating,
      setNewRating,
      hoverRating,
      setHoverRating,
      newComment,
      setNewComment,
      newName,
      setNewName,
      newDate,
      setNewDate,
      newImages,
      setNewImages,
      addError,
      handleAdd: handleAddReview,
      isAdding: insertMutation.isPending,
    },
    editingReview,
    setEditingReview,
    openEdit,
    editForm: {
      editRating,
      setEditRating,
      editHoverRating,
      setEditHoverRating,
      editComment,
      setEditComment,
      editName,
      setEditName,
      editDate,
      setEditDate,
      editImages,
      setEditImages,
      editError,
      handleEdit: handleEditReview,
      isEditing: editMutation.isPending,
    },
    toggleStatus,
    isToggling: updateMutation.isPending,
    deleteReview: (id: string) => deleteMutation.mutate(id),
  };
}
