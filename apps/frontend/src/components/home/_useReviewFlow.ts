"use client";

import { useState } from "react";

import type { OrderItem } from "./_useReviewPromptState";

interface UseReviewFlowArgs {
  reviewableItems: OrderItem[];
  finishReviewing: () => void;
}

export function useReviewFlow({ reviewableItems, finishReviewing }: UseReviewFlowArgs) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);

  const handleCardClick = () => {
    setCurrentItemIndex(0);
    setShowReviewModal(true);
  };

  const handleReviewSkip = () => {
    setShowReviewModal(false);
    // Wait for ReviewModal scroll lock cleanup before opening RatingModal
    setTimeout(() => setShowRatingModal(true), 250);
  };

  const handleReviewSubmit = (comment: string, images: File[]) => {
    setReviewComment(comment);
    setReviewImages(images);
    setShowReviewModal(false);
    // Wait for ReviewModal scroll lock cleanup before opening RatingModal
    setTimeout(() => setShowRatingModal(true), 250);
  };

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    setReviewComment("");
    setReviewImages([]);

    // Move to next item or finish
    if (currentItemIndex < reviewableItems.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setTimeout(() => setShowReviewModal(true), 300);
    } else {
      // All items reviewed, remove prompt
      finishReviewing();
    }
  };

  const handleRatingClose = () => {
    setShowRatingModal(false);
    setReviewComment("");
    setReviewImages([]);
  };

  const closeReviewModal = () => setShowReviewModal(false);

  return {
    currentItemIndex,
    showReviewModal,
    showRatingModal,
    reviewComment,
    reviewImages,
    handleCardClick,
    handleReviewSkip,
    handleReviewSubmit,
    handleRatingSuccess,
    handleRatingClose,
    closeReviewModal,
  };
}
