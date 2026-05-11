"use client";

import { useState } from "react";
import {
  useReviews,
  useReviewSummary,
  useCanReview,
} from "@/lib/hooks/useReviews";
import { ChevronDownBig, ChevronRightProduct, Star, StarEmpty } from "../svg";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { ReviewModal } from "./ReviewModal";
import { RatingModal } from "./RatingModal";
import Image from "next/image";
import { parseAsUTC } from "@/lib/utils/formatters";
import { MutedText, PrimaryHeading } from "@/components/ui/typography";

interface ReviewsProps {
  productId: string;
  productName: string;
  productDescription?: string | null;
  productImage?: string | null;
  reviewsOnly?: boolean;
  onMobileTitleClick?: () => void;
}

function maskName(firstName: string | null, lastName: string | null): string {
  const name = firstName || lastName || "Хэрэглэгч";
  if (name.length <= 1) return name + "***";
  return name[0] + "**" + name[name.length - 1];
}

function formatDate(dateStr: string): string {
  return parseAsUTC(dateStr)
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, ".");
}

export const Reviews = ({
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
  const { data: summary, isLoading: summaryLoading } =
    useReviewSummary(productId);
  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: reviewsLoading,
  } = useReviews(productId, selectedRating);
  const { data: canReview } = useCanReview(productId, userId);

  const reviews = reviewPages?.pages.flatMap((page) => page.data) ?? [];
  const roundedRating = summary ? Math.round(summary.averageRating) : 0;
  const distribution = summary?.distribution ?? [
    { stars: 5, percentage: 0 },
    { stars: 4, percentage: 0 },
    { stars: 3, percentage: 0 },
    { stars: 2, percentage: 0 },
    { stars: 1, percentage: 0 },
  ];

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {!reviewsOnly && (
        <div className="flex flex-col gap-3 md:gap-4 pt-0 md:pt-12 pb-6">
          {onMobileTitleClick ? (
            <button
              onClick={onMobileTitleClick}
              className="py-1 flex items-center justify-between cursor-pointer md:pointer-events-none"
            >
              <PrimaryHeading>
                Үнэлгээ ба сэтгэгдлүүд
              </PrimaryHeading>
              <span className="md:hidden">
                <ChevronRightProduct />
              </span>
            </button>
          ) : (
            <p className="py-1 text-[#020617] font-semibold text-xl font-manrope">
              Үнэлгээ ба сэтгэгдлүүд
            </p>
          )}

          {/* Rating Summary */}
          <div className="flex items-center gap-6 sm:gap-8 py-5">
            <div className="flex flex-col items-center gap-4 sm:gap-6 pl-2 sm:pl-4">
              {summaryLoading ? (
                <div className="h-12 w-16 skeleton" />
              ) : (
                <p className="text-[#020617] text-5xl leading-12 font-semibold font-manrope">
                  {summary?.averageRating ?? 0}
                </p>
              )}
              <div className="flex flex-col gap-[6px] items-center">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) =>
                    i < roundedRating ? <Star key={i} /> : <StarEmpty key={i} />,
                  )}
                </div>
                <p className="text-[#020617] text-ms font-normal font-manrope">
                  {summary?.totalCount ?? 0} үнэлгээ
                </p>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="w-px bg-[#E2E8F0] self-stretch py-[3px]" />

            {/* Right: Rating Distribution */}
            <div className="flex flex-col gap-1 flex-1 px-1.5 justify-center">
              {distribution.map((item) => (
                <div key={item.stars} className="relative flex items-center">
                  <button
                    onClick={() =>
                      setSelectedRating(
                        selectedRating === item.stars ? null : item.stars,
                      )
                    }
                    className={`flex items-center gap-[10px] flex-1 cursor-pointer transition-all duration-200 ${
                      selectedRating === item.stars ? "pr-9" : "pr-0"
                    }`}
                  >
                    <p className="text-[#334155] text-sm font-medium font-manrope w-4 tracking-[-0.56px]">
                      {item.stars}
                    </p>
                    <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      {item.percentage > 0 && (
                        <div
                          className="h-full bg-[#F59E0B] rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      )}
                    </div>
                    <p className="text-[#334155] text-sm font-medium font-manrope w-[38px] text-right">
                      {item.percentage}
                      <span className="pl-px">%</span>
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedRating(null)}
                    className={`absolute right-0 w-7 h-7 flex items-center justify-center bg-[#020617] rounded-sm cursor-pointer transition-all duration-200 ${
                      selectedRating === item.stars
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75 pointer-events-none"
                    }`}
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Review Button - Only show if user has purchased the product */}
          {canReview && (
            <div className="flex justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full px-3 py-3.5 border border-[#E2E8F0] rounded-sm text-[#020617] text-lg font-normal font-manrope hover:bg-surface transition-all duration-200 cursor-pointer"
              >
                Үнэлгээ өгөх
              </button>
            </div>
          )}
        </div>
      )}

      {!reviewsOnly && (
        <div className="py-2 block md:hidden">
          <div className="w-full h-px bg-[#E2E8F0]" />
        </div>
      )}

      {/* Reviews List */}
      <div className="flex flex-col gap-3 pb-0 md:pb-14">
        {reviewsLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2.5 py-3 px-0.5">
              <div className="h-5 w-20 skeleton" />
              <div className="h-4 w-24 skeleton" />
              <div className="h-16 w-full skeleton" />
              <div className="h-3 w-16 skeleton" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-6 md:gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="p-[9px]">
                <MessageCircle size={30} color="#64748B" strokeWidth={1.5} />
              </div>
              <MutedText>
                {selectedRating
                  ? `${selectedRating} одтой сэтгэгдэл байхгүй байна`
                  : "Сэтгэгдэл байхгүй байна"}
              </MutedText>
            </div>

            {selectedRating ? (
              <button
                onClick={() => setSelectedRating(null)}
                className="px-3 py-2.5 flex items-center gap-0.5 text-[#020617] font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px] cursor-pointer"
              >
                <span className="px-0.5">Бүгдийг харах</span>
                <ChevronRightProduct />
              </button>
            ) : (
              <Link
                href="/products"
                className="px-3 py-2.5 flex items-center gap-0.5 text-[#020617] font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px]"
              >
                <span className="px-0.5">Бараа сонирхох</span>
                <ChevronRightProduct />
              </Link>
            )}
          </div>
        ) : (
          reviews.map((review, index) => (
            <div key={review.id}>
              <div className="flex flex-col gap-2.5 py-3 px-0.5">
                {/* Username & Stars */}
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#020617] text-base font-normal font-manrope">
                    {maskName(
                      review.users?.first_name ?? null,
                      review.users?.last_name ?? null,
                    )}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) =>
                      i < review.rating ? (
                        <Star key={i} />
                      ) : (
                        <StarEmpty key={i} />
                      ),
                    )}
                  </div>
                </div>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2">
                    {review.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt="Review Image"
                        width={84}
                        height={84}
                        quality={75}
                        className="w-[84px] h-[84px] object-cover object-center rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Comment */}
                {review.comment && (
                  <p className="text-[#020617] text-lg font-normal font-manrope leading-7">
                    {review.comment}
                  </p>
                )}

                {/* Date */}
                <p className="text-[#64748B] text-xs font-normal font-manrope">
                  {formatDate(review.created_at)}
                </p>
              </div>

              {/* Separator */}
              {index < reviews.length - 1 && (
                <div className="py-2 mt-3">
                  <div className="w-full h-px bg-[#E2E8F0]" />
                </div>
              )}
            </div>
          ))
        )}

        {hasNextPage && (
          <button
            className="px-3 py-2.5 md:py-3.5 border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            <span className="px-0.5 text-[#020617] font-normal text-base md:text-lg font-manrope">
              {isFetchingNextPage ? "Ачааллаж байна..." : "Цааш нь үзэх"}
            </span>
            {!isFetchingNextPage && <ChevronDownBig />}
          </button>
        )}
      </div>

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
