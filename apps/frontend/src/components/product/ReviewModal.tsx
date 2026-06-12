"use client";

import { createPortal } from "react-dom";

import { Cancel } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { ReviewModalImageRow } from "./_reviewModal/ReviewModalImageRow";
import { useModalOpenAnimation } from "./_reviewModal/useModalOpenAnimation";
import { useReviewModalForm } from "./_reviewModal/useReviewModalForm";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSubmitWithComment: (comment: string, images: File[]) => void;
}

export const ReviewModal = ({ isOpen, onClose, onSkip, onSubmitWithComment }: ReviewModalProps) => {
  const {
    comment,
    setComment,
    images,
    previews,
    fileInputRef,
    handleImageSelect,
    handleRemoveImage,
    reset,
    canAddMore,
  } = useReviewModalForm();

  const { visible, animate } = useModalOpenAnimation(isOpen, onClose);

  useScrollLock(visible);

  const handleSkip = () => {
    reset();
    onSkip();
  };

  const handleSubmitWithComment = () => {
    onSubmitWithComment(comment, images);
    reset();
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[544px] bg-white rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>Сэтгэгдэл бичих</PrimaryHeading>
          <button onClick={handleSkip} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        {/* Image Upload + Comment */}
        <div className="flex flex-col gap-4">
          <ReviewModalImageRow
            previews={previews}
            canAddMore={canAddMore}
            fileInputRef={fileInputRef}
            onSelect={handleImageSelect}
            onRemove={handleRemoveImage}
          />

          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Сэтгэгдэл бичих"
            className="w-full min-h-[120px] px-3 py-2 border border-border rounded-sm text-text-primary font-normal text-base font-manrope placeholder:text-text-secondary resize-none focus:outline-none focus:border-text-primary transition-colors duration-200"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
          >
            Алгасах
          </button>
          <button
            onClick={handleSubmitWithComment}
            disabled={!comment.trim()}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 disabled:bg-text-primary/30 disabled:cursor-not-allowed"
          >
            <span className="hidden md:inline">Сэтгэгдэл оруулах</span>
            <span className="md:hidden">Оруулах</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
