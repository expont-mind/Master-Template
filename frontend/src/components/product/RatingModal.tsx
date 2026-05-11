"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import Image from "next/image";
import { Cancel, StarFilled, StarNotFilled } from "../svg";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { compressImages } from "@/lib/utils/image-compression";
import { reviewKeys } from "@/lib/queries/reviews";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  productId: string;
  productName: string;
  productDescription?: string | null;
  productImage?: string | null;
  comment?: string;
  images?: File[];
}

export const RatingModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  productId,
  productName,
  productDescription,
  productImage,
  comment,
  images,
}: RatingModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Compress and upload images to Supabase storage
      const imageUrls: string[] = [];
      if (images && images.length > 0) {
        const compressedImages = await compressImages(images);
        for (const image of compressedImages) {
          const fileName = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("reviews")
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("reviews")
            .getPublicUrl(fileName);

          imageUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment: comment?.trim() || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: "active",
      });

      if (error) throw error;

      // Invalidate all review-related caches (list, summary, canReview, canReviewAny)
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        handleClose();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible || typeof window === "undefined") return null;

  const displayRating = hoverRating || rating;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={handleClose}
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
          <p className="text-[#020617] font-semibold text-xl font-manrope">
            Үнэлгээ өгөх
          </p>
          <button
            onClick={handleClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex items-center gap-3">
          <div className="w-[64px] h-[64px] rounded-sm border border-[#F1F5F9] shrink-0 overflow-hidden bg-[#F8FAFC]">
            {productImage ? (
              <Image
                src={productImage}
                alt={productName}
                width={64}
                height={64}
                quality={75}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#E2E8F0]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[#020617] font-normal text-lg font-manrope leading-7 truncate">
              {productName}
            </p>
            {productDescription && (
              <p className="text-[#64748B] font-normal text-base font-manrope truncate">
                {productDescription}
              </p>
            )}
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex flex-col items-center pb-2">
          <p className="text-[#020617] font-normal text-sm font-manrope">
            Үнэлгээ{" "}
            {rating > 0 && (
              <span className="text-[#64748B]">({rating} од сонгогдсон)</span>
            )}
          </p>
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                className="cursor-pointer"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
              >
                {i < displayRating ? (
                  <div className="px-1 py-6">
                    <StarFilled />
                  </div>
                ) : (
                  <div className="px-1 py-6">
                    <StarNotFilled />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full px-3 py-2.5 h-11 bg-[#020617] rounded-sm text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200 cursor-pointer disabled:bg-[rgba(2,6,23,0.30)] disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Илгээж байна..." : "Оруулах"}
        </button>
      </div>
    </div>,
    document.body,
  );
};
