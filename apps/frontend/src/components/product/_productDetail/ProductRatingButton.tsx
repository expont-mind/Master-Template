import { SITE } from "@repo/config-site";

import { Star, StarEmpty } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

interface ProductRatingButtonProps {
  averageRating: number;
  totalCount: number;
  onClick: () => void;
}

/**
 * Star row + numeric average + " {N} Сэтгэгдэл" link that scrolls (or
 * opens drawer on mobile) to the reviews section. Self-gates on the
 * reviews feature flag.
 */
export function ProductRatingButton({
  averageRating,
  totalCount,
  onClick,
}: ProductRatingButtonProps) {
  if (!SITE.features.reviews) return null;
  return (
    <button onClick={onClick} className="flex items-center gap-1 cursor-pointer">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) =>
          i < Math.round(averageRating) ? <Star key={i} /> : <StarEmpty key={i} />,
        )}
      </div>
      <PrimaryMediumSm>{averageRating}</PrimaryMediumSm>
      <p className="text-text-secondary font-normal text-xs font-manrope underline underline-offset-2">
        {totalCount} Сэтгэгдэл
      </p>
    </button>
  );
}
