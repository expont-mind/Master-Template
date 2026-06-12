"use client";

// Desktop "Added to cart" success modal. Shows the product thumbnail + name
// + price summary, with "Go to cart" / "Keep shopping" CTAs.
//
// Mobile uses the drawer-based AddToCartModal flow; this component is only
// rendered when AddToCartModal detects a desktop viewport.

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Cancel } from "@/components/svg";
import { MutedMediumSm, PrimaryHeading, PrimarySemiboldSm } from "@/components/ui/typography";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/formatters";

interface AddToCartDesktopSuccessProps {
  animate: boolean;
  onClose: () => void;
  displayImage: string | null;
  displayName: string;
  sku: string | null | undefined;
  currentPrice: number;
  currentDiscountPrice: number | null;
  discount: number | null;
  sellingPrice: number;
}

export function AddToCartDesktopSuccess({
  animate,
  onClose,
  displayImage,
  displayName,
  sku,
  currentPrice,
  currentDiscountPrice,
  discount,
  sellingPrice,
}: AddToCartDesktopSuccessProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-[480px] bg-white rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>Сагсанд нэмэгдлээ</PrimaryHeading>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex gap-5 pb-4">
          <div className="w-[104px] h-[104px] rounded-sm border border-border-light shrink-0 overflow-hidden">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={displayName}
                width={104}
                height={104}
                quality={90}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-border" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-col">
              {sku && <MutedMediumSm>{sku}</MutedMediumSm>}
              <p className="text-text-primary font-semibold text-sm font-manrope leading-5">
                {displayName}
              </p>
            </div>
            <div className="flex flex-col">
              {currentDiscountPrice != null && currentDiscountPrice < currentPrice && (
                <p className="text-text-secondary font-normal text-xs font-manrope line-through">
                  {formatPrice(currentPrice)}
                </p>
              )}
              <div className="flex items-center gap-1">
                {discount && (
                  <p className="text-brand-primary font-semibold text-sm font-manrope">
                    {discount}%
                  </p>
                )}
                <PrimarySemiboldSm>{formatPrice(sellingPrice)}</PrimarySemiboldSm>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              router.push(ROUTES.CART);
            }}
            className="flex px-3 py-2.5 h-11 border border-border rounded-sm text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200 cursor-pointer"
          >
            Сагсруу очих
          </button>
          <button
            onClick={onClose}
            className="flex px-3 py-2.5 h-11 bg-text-primary rounded-sm text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 cursor-pointer"
          >
            Өөр бараа үзэх
          </button>
        </div>
      </div>
    </div>
  );
}
