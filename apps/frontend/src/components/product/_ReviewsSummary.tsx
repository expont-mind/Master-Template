"use client";

// Average-rating + per-star distribution block used by Reviews.tsx.

import { X } from "lucide-react";

import { ChevronRightProduct, Star, StarEmpty } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

interface ReviewSummaryData {
  averageRating: number;
  totalCount: number;
  distribution: { stars: number; percentage: number }[];
}

interface ReviewsSummaryProps {
  summary: ReviewSummaryData | undefined;
  summaryLoading: boolean;
  selectedRating: number | null;
  setSelectedRating: (r: number | null) => void;
  canReview: boolean | undefined;
  onOpenReviewModal: () => void;
  onMobileTitleClick?: () => void;
}

function ReviewsTitleHeader({ onMobileTitleClick }: { onMobileTitleClick?: () => void }) {
  if (onMobileTitleClick) {
    return (
      <button
        onClick={onMobileTitleClick}
        className="py-1 flex items-center justify-between cursor-pointer md:pointer-events-none"
      >
        <PrimaryHeading>Үнэлгээ ба сэтгэгдлүүд</PrimaryHeading>
        <span className="md:hidden">
          <ChevronRightProduct />
        </span>
      </button>
    );
  }
  return (
    <p className="py-1 text-text-primary font-semibold text-xl font-manrope">
      Үнэлгээ ба сэтгэгдлүүд
    </p>
  );
}

function DistributionRow({
  item,
  selectedRating,
  setSelectedRating,
}: {
  item: { stars: number; percentage: number };
  selectedRating: number | null;
  setSelectedRating: (r: number | null) => void;
}) {
  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setSelectedRating(selectedRating === item.stars ? null : item.stars)}
        className={`flex items-center gap-[10px] flex-1 cursor-pointer transition-all duration-200 ${
          selectedRating === item.stars ? "pr-9" : "pr-0"
        }`}
      >
        <p className="text-slate-700 text-sm font-medium font-manrope w-4 tracking-[-0.56px]">
          {item.stars}
        </p>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          {item.percentage > 0 && (
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${item.percentage}%` }}
            />
          )}
        </div>
        <p className="text-slate-700 text-sm font-medium font-manrope w-[38px] text-right">
          {item.percentage}
          <span className="pl-px">%</span>
        </p>
      </button>
      <button
        onClick={() => setSelectedRating(null)}
        className={`absolute right-0 w-7 h-7 flex items-center justify-center bg-text-primary rounded-sm cursor-pointer transition-all duration-200 ${
          selectedRating === item.stars
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75 pointer-events-none"
        }`}
      >
        <X size={16} className="text-white" />
      </button>
    </div>
  );
}

export function ReviewsSummary({
  summary,
  summaryLoading,
  selectedRating,
  setSelectedRating,
  canReview,
  onOpenReviewModal,
  onMobileTitleClick,
}: ReviewsSummaryProps) {
  const roundedRating = summary ? Math.round(summary.averageRating) : 0;
  const distribution = summary?.distribution ?? [
    { stars: 5, percentage: 0 },
    { stars: 4, percentage: 0 },
    { stars: 3, percentage: 0 },
    { stars: 2, percentage: 0 },
    { stars: 1, percentage: 0 },
  ];

  return (
    <div className="flex flex-col gap-3 md:gap-4 pt-0 md:pt-12 pb-6">
      <ReviewsTitleHeader onMobileTitleClick={onMobileTitleClick} />

      <div className="flex items-center gap-6 sm:gap-8 py-5">
        <div className="flex flex-col items-center gap-4 sm:gap-6 pl-2 sm:pl-4">
          {summaryLoading ? (
            <div className="h-12 w-16 skeleton" />
          ) : (
            <p className="text-text-primary text-5xl leading-12 font-semibold font-manrope">
              {summary?.averageRating ?? 0}
            </p>
          )}
          <div className="flex flex-col gap-[6px] items-center">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) =>
                i < roundedRating ? <Star key={i} /> : <StarEmpty key={i} />,
              )}
            </div>
            <p className="text-text-primary text-ms font-normal font-manrope">
              {summary?.totalCount ?? 0} үнэлгээ
            </p>
          </div>
        </div>

        <div className="w-px bg-border self-stretch py-[3px]" />

        <div className="flex flex-col gap-1 flex-1 px-1.5 justify-center">
          {distribution.map((item) => (
            <DistributionRow
              key={item.stars}
              item={item}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
            />
          ))}
        </div>
      </div>

      {canReview && (
        <div className="flex justify-center">
          <button
            onClick={onOpenReviewModal}
            className="w-full px-3 py-3.5 border border-border rounded-sm text-text-primary text-lg font-normal font-manrope hover:bg-surface transition-all duration-200 cursor-pointer"
          >
            Үнэлгээ өгөх
          </button>
        </div>
      )}
    </div>
  );
}
