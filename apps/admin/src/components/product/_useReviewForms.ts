"use client";

import { useState } from "react";

import type { ReviewWithImages } from "./_useProductReviews";

function makeNoonToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export function useReviewAddForm() {
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(makeNoonToday);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  const resetAddForm = () => {
    setNewRating(0);
    setHoverRating(0);
    setNewComment("");
    setNewName("");
    setNewDate(makeNoonToday());
    setNewImages([]);
    setAddError(null);
  };

  return {
    state: {
      newRating,
      hoverRating,
      newComment,
      newName,
      newDate,
      newImages,
      addError,
    },
    setters: {
      setNewRating,
      setHoverRating,
      setNewComment,
      setNewName,
      setNewDate,
      setNewImages,
      setAddError,
    },
    resetAddForm,
  };
}

export function useReviewEditForm() {
  const [editingReview, setEditingReview] = useState<ReviewWithImages | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  return {
    state: {
      editingReview,
      editRating,
      editHoverRating,
      editComment,
      editName,
      editDate,
      editImages,
      editError,
    },
    setters: {
      setEditingReview,
      setEditRating,
      setEditHoverRating,
      setEditComment,
      setEditName,
      setEditDate,
      setEditImages,
      setEditError,
    },
  };
}
