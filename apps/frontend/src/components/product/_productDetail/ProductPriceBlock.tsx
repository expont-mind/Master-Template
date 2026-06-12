import { formatPrice } from "@/lib/utils/formatters";

interface ProductPriceBlockProps {
  discount: number | null;
  sellingPrice: number;
  currentPrice: number;
}

/**
 * "20% 19,990₮ 24,990₮" pricing row used on both mobile and desktop.
 * Hides the percent badge and the strike-through original price when
 * no discount is applicable.
 */
export function ProductPriceBlock({
  discount,
  sellingPrice,
  currentPrice,
}: ProductPriceBlockProps) {
  return (
    <div className="flex items-end gap-1 transition-all duration-300">
      {discount && (
        <span className="text-brand-primary font-semibold text-2xl font-manrope transition-all duration-300">
          {discount}%
        </span>
      )}
      <p className="text-text-primary font-semibold text-2xl font-manrope tracking-[-1.44px] transition-all duration-300">
        {formatPrice(sellingPrice)}
      </p>
      {discount && (
        <p className="text-text-secondary font-normal text-base font-manrope pb-[3px] line-through transition-all duration-300">
          {formatPrice(currentPrice)}
        </p>
      )}
    </div>
  );
}
