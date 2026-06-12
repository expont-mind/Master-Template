"use client";

import { SITE } from "@repo/config-site";
import { useState } from "react";

import { useReviews, useReviewSummary, useCanReview } from "@/lib/hooks/useReviews";
import { useWishlistStore } from "@/stores/wishlist-store";

import { ReviewsList } from "./_ReviewsList";
import { ReviewsSummary } from "./_ReviewsSummary";
import { RatingModal } from "./RatingModal";
import { ReviewModal } from "./ReviewModal";

interface ReviewsProps {
  productId: string;
  productName: string;
  productDescription?: string | null;
  productImage?: string | null;
  reviewsOnly?: boolean;
  onMobileTitleClick?: () => void;
}

// Wrapper/inner split: when reviews are disabled, no hooks run and no
// review queries fire. Call sites need no guard of their own.
export const Reviews = (props: ReviewsProps) => {
  if (!SITE.features.reviews) return null;
  return <ReviewsInner {...props} />;
};

const ReviewsInner = ({
  productId,
  productName,
  productDescription,
  productImage,
  reviewsOnly,
  onMobileTitleClick,
}: ReviewsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const userId = useWishlistStore((s) => s.userId);
  const { data: summary, isLoading: summaryLoading } = useReviewSummary(productId);
  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: reviewsLoading,
  } = useReviews(productId, selectedRating);
  const { data: canReview } = useCanReview(productId, userId);

  const reviews = reviewPages?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {!reviewsOnly && (
        <ReviewsSummary
          summary={summary}
          summaryLoading={summaryLoading}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
          canReview={canReview}
          onOpenReviewModal={() => setIsModalOpen(true)}
          onMobileTitleClick={onMobileTitleClick}
        />
      )}

      {!reviewsOnly && (
        <div className="py-2 block md:hidden">
          <div className="w-full h-px bg-border" />
        </div>
      )}

      <ReviewsList
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSkip={() => {
          setIsModalOpen(false);
          setReviewComment("");
          setReviewImages([]);
          setIsRatingModalOpen(true);
        }}
        onSubmitWithComment={(comment, images) => {
          setReviewComment(comment);
          setReviewImages(images);
          setIsModalOpen(false);
          setIsRatingModalOpen(true);
        }}
      />

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setReviewComment("");
          setReviewImages([]);
        }}
        onSubmitSuccess={() => {
          setIsRatingModalOpen(false);
          setReviewComment("");
          setReviewImages([]);
        }}
        productId={productId}
        productName={productName}
        productDescription={productDescription}
        productImage={productImage}
        comment={reviewComment}
        images={reviewImages}
      />
    </div>
  );
};
