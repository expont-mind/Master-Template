"use client";

import { ProductVariants } from "@/components/product/ProductVariants";

import { ProductBrandLink } from "./ProductBrandLink";
import { ProductDescription } from "./ProductDescription";
import { ProductPriceBlock } from "./ProductPriceBlock";
import { ProductRatingButton } from "./ProductRatingButton";

import type { OptionGroup, ProductVariant, ProductWithDetails } from "@/lib/queries/products";

interface ProductInfoMobileProps {
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
  onOpenReviewsDrawer: () => void;
}

/** Mobile-only product info panel shown below the image carousel. */
export function ProductInfoMobile({
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
  onOpenReviewsDrawer,
}: ProductInfoMobileProps) {
  return (
    <div className="md:hidden flex flex-col gap-1 w-full px-4 pb-6">
      <div className="py-2">
        <div className="w-full h-px bg-border" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:gap-2.5">
            <div className="flex flex-col gap-1 pb-1">
              <ProductBrandLink brand={product.brand} />
              <p className="text-text-primary font-medium text-lg font-manrope leading-7 transition-all duration-300">
                {product.name}
              </p>
            </div>

            <ProductRatingButton
              averageRating={averageRating}
              totalCount={reviewCount}
              onClick={onOpenReviewsDrawer}
            />
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
              expansionPadding={192}
            />
          )}
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
    </div>
  );
}
