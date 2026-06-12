"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Cancel, StarFilled, StarNotFilled } from "@/components/svg";
import { PrimaryHeading, PrimarySm } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { reviewKeys } from "@/lib/queries/reviews";
import { createClient } from "@/lib/supabase/client";
import { compressImages } from "@/lib/utils/image-compression";
import { log } from "@/lib/utils/logger";

async function uploadReviewImages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  images: File[] | undefined,
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const compressedImages = await compressImages(images);
  const imageUrls: string[] = [];
  for (const image of compressedImages) {
    const fileName = `${userId}/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
    const { error: uploadError } = await supabase.storage.from("reviews").upload(fileName, image);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("reviews").getPublicUrl(fileName);
    imageUrls.push(urlData.publicUrl);
  }
  return imageUrls;
}

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

function ProductInfoHeader({
  name,
  description,
  image,
}: {
  name: string;
  description?: string | null;
  image?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[64px] h-[64px] rounded-sm border border-border-light shrink-0 overflow-hidden bg-surface">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={64}
            height={64}
            quality={90}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-border" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-text-primary font-normal text-lg font-manrope leading-7 truncate">
          {name}
        </p>
        {description && (
          <p className="text-text-secondary font-normal text-base font-manrope truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function RatingStars({
  rating,
  hoverRating,
  onRate,
  onHover,
}: {
  rating: number;
  hoverRating: number;
  onRate: (n: number) => void;
  onHover: (n: number) => void;
}) {
  const displayRating = hoverRating || rating;
  return (
    <div className="flex flex-col items-center pb-2">
      <PrimarySm>
        Үнэлгээ{" "}
        {rating > 0 && <span className="text-text-secondary">({rating} од сонгогдсон)</span>}
      </PrimarySm>
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            className="cursor-pointer"
            onClick={() => onRate(i + 1)}
            onMouseEnter={() => onHover(i + 1)}
            onMouseLeave={() => onHover(0)}
          >
            <div className="px-1 py-6">
              {i < displayRating ? <StarFilled /> : <StarNotFilled />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
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
      // Intentional sync: mount before the entry animation runs in next RAFs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

      const imageUrls = await uploadReviewImages(supabase, user.id, productId, images);

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment: comment?.trim() || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: "active",
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: reviewKeys.all });

      if (onSubmitSuccess) onSubmitSuccess();
      else handleClose();
    } catch (error) {
      log.error("review_submit_failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
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
        <div className="flex items-center justify-between">
          <PrimaryHeading>Үнэлгээ өгөх</PrimaryHeading>
          <button onClick={handleClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        <ProductInfoHeader
          name={productName}
          description={productDescription}
          image={productImage}
        />

        <RatingStars
          rating={rating}
          hoverRating={hoverRating}
          onRate={setRating}
          onHover={setHoverRating}
        />

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full px-3 py-2.5 h-11 bg-text-primary rounded-sm text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 cursor-pointer disabled:bg-text-primary/30 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Илгээж байна..." : "Оруулах"}
        </button>
      </div>
    </div>,
    document.body,
  );
};
