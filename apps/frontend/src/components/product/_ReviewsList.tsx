"use client";

// Review list with loading/empty/load-more states used by Reviews.tsx.

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ChevronDownBig, ChevronRightProduct, Star, StarEmpty } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { parseAsUTC } from "@/lib/utils/formatters";

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

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  images?: string[] | null;
  users?: { first_name: string | null; last_name: string | null } | null;
}

interface ReviewsListProps {
  reviews: ReviewItem[];
  reviewsLoading: boolean;
  selectedRating: number | null;
  setSelectedRating: (r: number | null) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 py-3 px-0.5">
      <div className="h-5 w-20 skeleton" />
      <div className="h-4 w-24 skeleton" />
      <div className="h-16 w-full skeleton" />
      <div className="h-3 w-16 skeleton" />
    </div>
  );
}

function EmptyState({
  selectedRating,
  setSelectedRating,
}: {
  selectedRating: number | null;
  setSelectedRating: (r: number | null) => void;
}) {
  return (
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
          className="px-3 py-2.5 flex items-center gap-0.5 text-text-primary font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px] cursor-pointer"
        >
          <span className="px-0.5">Бүгдийг харах</span>
          <ChevronRightProduct />
        </button>
      ) : (
        <Link
          href="/products"
          className="px-3 py-2.5 flex items-center gap-0.5 text-text-primary font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px]"
        >
          <span className="px-0.5">Бараа сонирхох</span>
          <ChevronRightProduct />
        </Link>
      )}
    </div>
  );
}

function ReviewItemView({ review, showSeparator }: { review: ReviewItem; showSeparator: boolean }) {
  return (
    <div>
      <div className="flex flex-col gap-2.5 py-3 px-0.5">
        <div className="flex flex-col gap-0.5">
          <p className="text-text-primary text-base font-normal font-manrope">
            {maskName(review.users?.first_name ?? null, review.users?.last_name ?? null)}
          </p>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) =>
              i < review.rating ? <Star key={i} /> : <StarEmpty key={i} />,
            )}
          </div>
        </div>

        {review.images && review.images.length > 0 && (
          <div className="flex gap-2">
            {review.images.map((image) => (
              <Image
                key={image}
                src={image}
                alt="Review Image"
                width={84}
                height={84}
                quality={90}
                className="w-[84px] h-[84px] object-cover object-center rounded-lg"
              />
            ))}
          </div>
        )}

        {review.comment && (
          <p className="text-text-primary text-lg font-normal font-manrope leading-7">
            {review.comment}
          </p>
        )}

        <p className="text-text-secondary text-xs font-normal font-manrope">
          {formatDate(review.created_at)}
        </p>
      </div>

      {showSeparator && (
        <div className="py-2 mt-3">
          <div className="w-full h-px bg-border" />
        </div>
      )}
    </div>
  );
}

export function ReviewsList({
  reviews,
  reviewsLoading,
  selectedRating,
  setSelectedRating,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ReviewsListProps) {
  return (
    <div className="flex flex-col gap-3 pb-0 md:pb-14">
      {reviewsLoading ? (
        Array.from({ length: 3 }, (_, i) => <ReviewSkeleton key={i} />)
      ) : reviews.length === 0 ? (
        <EmptyState selectedRating={selectedRating} setSelectedRating={setSelectedRating} />
      ) : (
        reviews.map((review, index) => (
          <ReviewItemView
            key={review.id}
            review={review}
            showSeparator={index < reviews.length - 1}
          />
        ))
      )}

      {hasNextPage && (
        <button
          className="px-3 py-2.5 md:py-3.5 border border-border rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          <span className="px-0.5 text-text-primary font-normal text-base md:text-lg font-manrope">
            {isFetchingNextPage ? "Ачааллаж байна..." : "Цааш нь үзэх"}
          </span>
          {!isFetchingNextPage && <ChevronDownBig />}
        </button>
      )}
    </div>
  );
}
