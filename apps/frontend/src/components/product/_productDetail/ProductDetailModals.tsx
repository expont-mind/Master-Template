"use client";

import { AddToCartModal } from "@/components/product/AddToCartModal";
import { ImageModal } from "@/components/product/ImageModal";
import { ReviewsDrawer } from "@/components/product/ReviewsDrawer";

import type { ProductVariant, ProductWithDetails } from "@/lib/queries/products";

interface ProductDetailModalsProps {
  product: ProductWithDetails;
  isAddToCartOpen: boolean;
  isImageModalOpen: boolean;
  isReviewsDrawerOpen: boolean;
  onCloseAddToCart: () => void;
  onCloseImageModal: () => void;
  onCloseReviewsDrawer: () => void;
  quantity: number;
  selectedVariant: ProductVariant | undefined;
  allImages: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Wraps the three portal-rendered overlays for the product detail
 * page so the main orchestrator's JSX tree stays shallow.
 */
export function ProductDetailModals({
  product,
  isAddToCartOpen,
  isImageModalOpen,
  isReviewsDrawerOpen,
  onCloseAddToCart,
  onCloseImageModal,
  onCloseReviewsDrawer,
  quantity,
  selectedVariant,
  allImages,
  currentImageIndex,
  setCurrentImageIndex,
}: ProductDetailModalsProps) {
  return (
    <>
      <AddToCartModal
        isOpen={isAddToCartOpen}
        onClose={onCloseAddToCart}
        product={product}
        quantity={quantity}
        variant={selectedVariant}
      />

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={onCloseImageModal}
        images={allImages}
        currentIndex={currentImageIndex}
        onIndexChange={setCurrentImageIndex}
        productName={product.name}
      />

      <ReviewsDrawer
        isOpen={isReviewsDrawerOpen}
        onClose={onCloseReviewsDrawer}
        productId={product.id}
        productName={product.name}
        productDescription={product.description}
        productImage={product.images?.[0]}
      />
    </>
  );
}
