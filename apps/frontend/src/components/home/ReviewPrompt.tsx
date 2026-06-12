"use client";

import { SITE } from "@repo/config-site";

import { RatingModal } from "@/components/product/RatingModal";
import { ReviewModal } from "@/components/product/ReviewModal";

import { ReviewPromptCard } from "./_ReviewPromptCard";
import { useReviewFlow } from "./_useReviewFlow";
import { useReviewPromptState } from "./_useReviewPromptState";

// Wrapper/inner split: when reviews are disabled, the prompt hooks
// (order lookup, reviewable-item scan) never run on the home page.
export function ReviewPrompt() {
  if (!SITE.features.reviews) return null;
  return <ReviewPromptInner />;
}

function ReviewPromptInner() {
  const { order, reviewableItems, dismissed, handleDismiss, finishReviewing } =
    useReviewPromptState();

  const {
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
  } = useReviewFlow({ reviewableItems, finishReviewing });

  if (dismissed || reviewableItems.length === 0 || !order) return null;

  const currentItem = reviewableItems[currentItemIndex];

  return (
    <>
      <ReviewPromptCard
        allItems={order.items}
        reviewableCount={reviewableItems.length}
        orderCreatedAt={order.created_at}
        onDismiss={handleDismiss}
        onCardClick={handleCardClick}
      />

      {/* Review Modal */}
      {currentItem && (
        <>
          <ReviewModal
            isOpen={showReviewModal}
            onClose={closeReviewModal}
            onSkip={handleReviewSkip}
            onSubmitWithComment={handleReviewSubmit}
          />
          <RatingModal
            isOpen={showRatingModal}
            onClose={handleRatingClose}
            onSubmitSuccess={handleRatingSuccess}
            productId={currentItem.product_id}
            productName={currentItem.products?.name ?? "Бүтээгдэхүүн"}
            productDescription={currentItem.products?.description}
            productImage={currentItem.products?.images?.[0]}
            comment={reviewComment}
            images={reviewImages}
          />
        </>
      )}
    </>
  );
}
