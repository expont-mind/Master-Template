"use client";

import { SITE } from "@repo/config-site";
import { forwardRef } from "react";

import { ProductVariants } from "@/components/product/ProductVariants";
import { Star, StarEmpty } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";
import { formatPrice } from "@/lib/utils/formatters";

import { AddToCartButtons } from "./AddToCartButtons";
import { ProductBrandLink } from "./ProductBrandLink";
import { ProductDescription } from "./ProductDescription";
import { ProductPriceBlock } from "./ProductPriceBlock";

import type { OptionGroup, ProductVariant, ProductWithDetails } from "@/lib/queries/products";

interface ProductInfoDesktopProps {
  product: ProductWithDetails;
  averageRating: number;
  reviewCount: number;
  discount: number | null;
  sellingPrice: number;
  currentPrice: number;
  currentStock: number;
  quantity: number;
  onQuantityChange: (q: number) => void;
  variants: ProductVariant[] | undefined;
  optionGroups: OptionGroup[] | undefined;
  selectedVariantId: string | undefined;
  onVariantChange: (variantId: string) => void;
  variantsLoading: boolean;
  descRef: React.RefObject<HTMLParagraphElement | null>;
  descExpanded: boolean;
  setDescExpanded: (next: (prev: boolean) => boolean) => void;
  descOverflows: boolean;
  descFullHeight: number;
  stickyTop: number;
  cartDisabled: boolean;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  onScrollToReviews: () => void;
}

/**
 * Sticky right-side panel on desktop. The ref is the panel container,
 * forwarded for the sticky-position offset hook.
 */
export const ProductInfoDesktop = forwardRef<HTMLDivElement, ProductInfoDesktopProps>(
  function ProductInfoDesktop(
    {
      product,
      averageRating,
      reviewCount,
      discount,
      sellingPrice,
      currentPrice,
      currentStock,
      quantity,
      onQuantityChange,
      variants,
      optionGroups,
      selectedVariantId,
      onVariantChange,
      variantsLoading,
      descRef,
      descExpanded,
      setDescExpanded,
      descOverflows,
      descFullHeight,
      stickyTop,
      cartDisabled,
      wishlisted,
      onToggleWishlist,
      onAddToCart,
      onScrollToReviews,
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className="hidden md:flex flex-col gap-5 w-full md:max-w-[368px] md:sticky md:self-start"
        style={{ top: `${stickyTop}px` }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-[14px]">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2 pb-1">
                <ProductBrandLink brand={product.brand} />
                <p className="text-text-primary font-semibold text-xl font-manrope leading-7 transition-all duration-300">
                  {product.name}
                </p>
              </div>

              {SITE.features.reviews && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) =>
                      i < Math.round(averageRating) ? <Star key={i} /> : <StarEmpty key={i} />,
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onScrollToReviews}
                    className="text-text-primary font-medium text-sm font-manrope cursor-pointer bg-transparent border-0 p-0"
                  >
                    {averageRating}
                  </button>
                  <button
                    type="button"
                    onClick={onScrollToReviews}
                    className="text-text-secondary font-normal text-xs font-manrope underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
                  >
                    {reviewCount} Сэтгэгдэл
                  </button>
                </div>
              )}
            </div>

            <ProductPriceBlock
              discount={discount}
              sellingPrice={sellingPrice}
              currentPrice={currentPrice}
            />

            {product.description && (
              <ProductDescription
                description={product.description}
                descRef={descRef}
                expanded={descExpanded}
                setExpanded={setDescExpanded}
                overflows={descOverflows}
                fullHeight={descFullHeight}
                desktop
              />
            )}
          </div>

          <div className="py-2">
            <div className="w-full h-px bg-border" />
          </div>

          <ProductVariants
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            maxQuantity={currentStock}
            variants={variants}
            selectedVariantId={selectedVariantId}
            onVariantChange={onVariantChange}
            productName={product.name}
            productImage={product.images?.[0]}
            optionGroups={optionGroups}
            loading={variantsLoading}
          />
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-border" />
        </div>

        {/* Total Block */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:static flex flex-col gap-3 md:gap-5">
          <div className="hidden md:flex justify-end items-end gap-3 px-0.5">
            <PrimaryMediumSm>Сонгосон хувилбарын үнэ:</PrimaryMediumSm>
            <p className="text-text-primary font-semibold text-xl font-manrope tracking-[-1.2px] leading-6 transition-all duration-300">
              {formatPrice(sellingPrice * quantity)}
            </p>
          </div>
          <div className="flex gap-3 md:pl-2 items-center px-4 py-3 md:px-0 md:py-0 bg-white">
            <AddToCartButtons
              wishlisted={wishlisted}
              cartDisabled={cartDisabled}
              currentStock={currentStock}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
            />
          </div>
        </div>
      </div>
    );
  },
);
