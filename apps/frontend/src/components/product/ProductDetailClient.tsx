"use client";

import { ProductBreadcrumb } from "./_productDetail/ProductBreadcrumb";
import { ProductDetailLeftColumn } from "./_productDetail/ProductDetailLeftColumn";
import { ProductDetailMobileBar } from "./_productDetail/ProductDetailMobileBar";
import { ProductDetailModals } from "./_productDetail/ProductDetailModals";
import { ProductInfoDesktop } from "./_productDetail/ProductInfoDesktop";
import { useProductDetailState } from "./_productDetail/useProductDetailState";
import { ProductDetailSkeleton } from "./detail/ProductDetailSkeleton";
import { ProductNotFound } from "./detail/ProductNotFound";

import type { ProductWithDetails } from "@/lib/queries/products";

type ResolvedState = Omit<ReturnType<typeof useProductDetailState>, "isLoading" | "product"> & {
  product: NonNullable<ReturnType<typeof useProductDetailState>["product"]>;
};

interface DetailColumnsProps {
  state: ResolvedState;
  variantsLoading: boolean;
  cartDisabled: boolean;
  totalReviewCount: number;
  averageRating: number;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  onReviewsTabClick: () => void;
}

function ProductDetailColumns({
  state,
  variantsLoading,
  cartDisabled,
  totalReviewCount,
  averageRating,
  onAddToCart,
  onToggleWishlist,
  onReviewsTabClick,
}: DetailColumnsProps) {
  const {
    product,
    pricing,
    relatedProducts,
    briefRef,
    detailsRef,
    reviewsRef,
    tabsRef,
    rightPanelRef,
    activeTab,
    showTopHeader,
    scrollToSection,
    setIsReviewsDrawerOpen,
    allImages,
    currentImageIndex,
    setCurrentImageIndex,
    imageScrollRef,
    handleImageScroll,
    scrollToImage,
    setIsImageModalOpen,
    quantity,
    setQuantity,
    selectedVariantId,
    handleVariantChange,
    descRef,
    descExpanded,
    setDescExpanded,
    descOverflows,
    descFullHeight,
    stickyTop,
    wishlisted,
  } = state;
  return (
    <div className="flex flex-col md:flex-row">
      <ProductDetailLeftColumn
        product={product}
        briefRef={briefRef}
        detailsRef={detailsRef}
        reviewsRef={reviewsRef}
        tabsRef={tabsRef}
        activeTab={activeTab}
        showTopHeader={showTopHeader}
        totalReviewCount={totalReviewCount}
        averageRating={averageRating}
        onSelectBrief={() => scrollToSection("brief")}
        onSelectDetails={() => scrollToSection("details")}
        onSelectReviewsTab={onReviewsTabClick}
        onOpenReviewsDrawer={() => setIsReviewsDrawerOpen(true)}
        allImages={allImages}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        imageScrollRef={imageScrollRef}
        handleImageScroll={handleImageScroll}
        scrollToImage={scrollToImage}
        onOpenImageModal={() => setIsImageModalOpen(true)}
        discount={pricing.discount}
        sellingPrice={pricing.sellingPrice}
        currentPrice={pricing.currentPrice}
        currentStock={pricing.currentStock}
        quantity={quantity}
        onQuantityChange={setQuantity}
        variants={product.variants}
        optionGroups={product.option_groups}
        selectedVariantId={selectedVariantId}
        onVariantChange={handleVariantChange}
        variantsLoading={variantsLoading}
        descRef={descRef}
        descExpanded={descExpanded}
        setDescExpanded={setDescExpanded}
        descOverflows={descOverflows}
        descFullHeight={descFullHeight}
        relatedProducts={relatedProducts}
      />

      <ProductInfoDesktop
        ref={rightPanelRef}
        product={product}
        averageRating={averageRating}
        reviewCount={totalReviewCount}
        discount={pricing.discount}
        sellingPrice={pricing.sellingPrice}
        currentPrice={pricing.currentPrice}
        currentStock={pricing.currentStock}
        quantity={quantity}
        onQuantityChange={setQuantity}
        variants={product.variants}
        optionGroups={product.option_groups}
        selectedVariantId={selectedVariantId}
        onVariantChange={handleVariantChange}
        variantsLoading={variantsLoading}
        descRef={descRef}
        descExpanded={descExpanded}
        setDescExpanded={setDescExpanded}
        descOverflows={descOverflows}
        descFullHeight={descFullHeight}
        stickyTop={stickyTop}
        cartDisabled={cartDisabled}
        wishlisted={wishlisted}
        onToggleWishlist={onToggleWishlist}
        onAddToCart={onAddToCart}
        onScrollToReviews={() => scrollToSection("reviews")}
      />
    </div>
  );
}

function ProductDetailBody({ state }: { state: ResolvedState }) {
  const { product, pricing, reviewSummary } = state;

  const variantsLoading = !!(pricing.hasVariants && !state.variantsReady);
  const cartDisabled = pricing.currentStock <= 0 || variantsLoading;
  const totalReviewCount = reviewSummary?.totalCount ?? 0;
  const averageRating = reviewSummary?.averageRating ?? 0;

  const handleAddToCart = () => {
    if (cartDisabled) return;
    state.setIsModalOpen(true);
  };

  const handleToggleWishlist = () => {
    if (!state.userId) {
      state.openLogin();
      return;
    }
    state.toggleWishlist(product);
  };

  const handleReviewsTabClick = () => {
    if (window.innerWidth < 768) {
      state.setIsReviewsDrawerOpen(true);
    } else {
      state.scrollToSection("reviews");
    }
  };

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-0 pb-0 md:pb-[200px]">
        <ProductBreadcrumb categoryPath={product.categoryPath} />
        <ProductDetailColumns
          state={state}
          variantsLoading={variantsLoading}
          cartDisabled={cartDisabled}
          totalReviewCount={totalReviewCount}
          averageRating={averageRating}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          onReviewsTabClick={handleReviewsTabClick}
        />
      </div>

      <ProductDetailMobileBar
        wishlisted={state.wishlisted}
        cartDisabled={cartDisabled}
        currentStock={pricing.currentStock}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <ProductDetailModals
        product={product}
        isAddToCartOpen={state.isModalOpen}
        isImageModalOpen={state.isImageModalOpen}
        isReviewsDrawerOpen={state.isReviewsDrawerOpen}
        onCloseAddToCart={() => state.setIsModalOpen(false)}
        onCloseImageModal={() => state.setIsImageModalOpen(false)}
        onCloseReviewsDrawer={() => state.setIsReviewsDrawerOpen(false)}
        quantity={state.quantity}
        selectedVariant={pricing.selectedVariant}
        allImages={state.allImages}
        currentImageIndex={state.currentImageIndex}
        setCurrentImageIndex={state.setCurrentImageIndex}
      />
    </div>
  );
}

/**
 * Top-level orchestrator for the product detail page. Composes a
 * breadcrumb, a left column (gallery + info + sections), a sticky
 * right desktop panel, a mobile fixed bottom bar, and modal overlays.
 *
 * All state, hooks, and refs live in `useProductDetailState`. This
 * component renders only.
 */
export function ProductDetailClient({
  slug,
  serverProduct,
}: {
  slug: string;
  serverProduct?: ProductWithDetails | null;
}) {
  const state = useProductDetailState(slug, serverProduct);

  if (state.isLoading) return <ProductDetailSkeleton />;
  if (!state.product) return <ProductNotFound />;

  return <ProductDetailBody state={state as ResolvedState} />;
}
