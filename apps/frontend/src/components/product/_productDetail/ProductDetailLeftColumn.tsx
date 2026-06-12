"use client";

import { SITE } from "@repo/config-site";

import { AdditionalDetails } from "@/components/product/AdditionalDetails";
import { Reviews } from "@/components/product/Reviews";

import { ProductGallery } from "./ProductGallery";
import { ProductInfoMobile } from "./ProductInfoMobile";
import { ProductTabsBar } from "./ProductTabsBar";
import { RelatedProductsSection } from "./RelatedProductsSection";

import type { OptionGroup, ProductVariant, ProductWithDetails } from "@/lib/queries/products";
import type { Product } from "@/types/database";
import type { ProductListItem } from "@/types/product";

interface ProductDetailLeftColumnProps {
  product: ProductWithDetails;
  // Refs owned by the orchestrator so scroll-spy + sticky hooks see
  // a stable ref reference across re-renders.
  briefRef: React.RefObject<HTMLDivElement | null>;
  detailsRef: React.RefObject<HTMLDivElement | null>;
  reviewsRef: React.RefObject<HTMLDivElement | null>;
  tabsRef: React.RefObject<HTMLDivElement | null>;
  // Tabs + scroll spy
  activeTab: string;
  showTopHeader: boolean;
  totalReviewCount: number;
  averageRating: number;
  onSelectBrief: () => void;
  onSelectDetails: () => void;
  onSelectReviewsTab: () => void;
  onOpenReviewsDrawer: () => void;
  // Gallery
  allImages: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  imageScrollRef: React.RefObject<HTMLDivElement | null>;
  handleImageScroll: () => void;
  scrollToImage: (index: number) => void;
  onOpenImageModal: () => void;
  // Mobile info
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
  // Related
  relatedProducts: ProductListItem[] | undefined;
}

/**
 * Left column for the product detail page: sticky tabs, image gallery,
 * mobile product info (price + variants + description), additional
 * details, reviews, and related products (mobile + desktop variants).
 *
 * Refs are owned by the orchestrator and threaded through so the
 * scroll-spy and sticky hooks always see the same ref objects.
 */
export function ProductDetailLeftColumn({
  product,
  briefRef,
  detailsRef,
  reviewsRef,
  tabsRef,
  activeTab,
  showTopHeader,
  totalReviewCount,
  averageRating,
  onSelectBrief,
  onSelectDetails,
  onSelectReviewsTab,
  onOpenReviewsDrawer,
  allImages,
  currentImageIndex,
  setCurrentImageIndex,
  imageScrollRef,
  handleImageScroll,
  scrollToImage,
  onOpenImageModal,
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
  relatedProducts,
}: ProductDetailLeftColumnProps) {
  const leafCategorySlug = product.categoryPath?.[product.categoryPath.length - 1]?.slug ?? "";

  return (
    <div className="flex flex-col w-full md:max-w-[696px]">
      <ProductTabsBar
        ref={tabsRef}
        activeTab={activeTab}
        showTopHeader={showTopHeader}
        reviewCount={totalReviewCount}
        onSelectBrief={onSelectBrief}
        onSelectDetails={onSelectDetails}
        onSelectReviews={onSelectReviewsTab}
      />

      <div className="flex flex-col gap-0 md:gap-[10px] max-w-[640px]">
        <div ref={briefRef}>
          <ProductGallery
            productName={product.name}
            allImages={allImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            imageScrollRef={imageScrollRef}
            handleImageScroll={handleImageScroll}
            scrollToImage={scrollToImage}
            onOpenImageModal={onOpenImageModal}
          />
        </div>
      </div>

      <ProductInfoMobile
        product={product}
        averageRating={averageRating}
        reviewCount={totalReviewCount}
        discount={discount}
        sellingPrice={sellingPrice}
        currentPrice={currentPrice}
        currentStock={currentStock}
        quantity={quantity}
        onQuantityChange={onQuantityChange}
        variants={variants}
        optionGroups={optionGroups}
        selectedVariantId={selectedVariantId}
        onVariantChange={onVariantChange}
        variantsLoading={variantsLoading}
        descRef={descRef}
        descExpanded={descExpanded}
        setDescExpanded={setDescExpanded}
        descOverflows={descOverflows}
        descFullHeight={descFullHeight}
        onOpenReviewsDrawer={onOpenReviewsDrawer}
      />

      <div className="w-full h-2 bg-border-light block md:hidden" />

      <div ref={detailsRef} className="flex flex-col">
        <AdditionalDetails
          productName={product.name}
          details={product.product_details}
          richDescription={product.rich_description}
          middleSlot={
            relatedProducts && relatedProducts.length > 0 ? (
              <RelatedProductsSection
                products={relatedProducts as Product[]}
                categorySlug={leafCategorySlug}
                visibility="desktop"
              />
            ) : undefined
          }
        />
      </div>

      <div className="w-full h-2 bg-border-light block md:hidden" />

      {/* <Reviews> self-gates; this condition only suppresses the wrapper's
          mobile spacing when the feature is off — not a correctness guard. */}
      {SITE.features.reviews && (
        <div
          ref={reviewsRef}
          className="flex flex-col max-w-[640px] w-full px-4 md:px-0 pt-4 md:pt-0 pb-8 md:pb-0"
        >
          <Reviews
            productId={product.id}
            productName={product.name}
            productDescription={product.description}
            productImage={product.images?.[0]}
            onMobileTitleClick={onOpenReviewsDrawer}
          />
        </div>
      )}

      <div className="w-full h-2 bg-border-light block md:hidden" />

      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProductsSection
          products={relatedProducts as Product[]}
          categorySlug={leafCategorySlug}
          visibility="mobile"
        />
      )}

      <div className="w-full h-2 bg-border-light block md:hidden" />
    </div>
  );
}
