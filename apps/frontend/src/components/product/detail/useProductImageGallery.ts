// Image gallery state for the product detail page.
//
// Responsibilities:
//   - Build the displayed image list in a stable order:
//     main product image → variant images (in variant array order) → remaining product images
//   - Track currentImageIndex via mobile carousel scroll
//   - Resolve where in that list a given variant's first image lives,
//     so selecting a variant scrolls the carousel to it.
//
// `imageScrollRef` is returned so the caller can attach it to the carousel
// element (a `<div>` with overflow-x: scroll on mobile).

import { useCallback, useMemo, useRef, useState } from "react";

import type { ProductWithDetails } from "@/lib/queries/products";

export function useProductImageGallery(product: ProductWithDetails | null | undefined) {
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Stable image order: main → variant images → remaining product images.
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: string[] = [];

    if (product.images && product.images.length > 0) {
      images.push(product.images[0]);
    }

    if (product.variants) {
      for (const variant of product.variants) {
        if (variant.images) images.push(...variant.images);
      }
    }

    if (product.images && product.images.length > 1) {
      images.push(...product.images.slice(1));
    }

    return images;
  }, [product]);

  // Find the starting image index for a given variant.
  const getVariantImageIndex = useCallback(
    (variantId: string) => {
      if (!product?.variants) return 0;
      const offset = product.images && product.images.length > 0 ? 1 : 0;
      let index = offset;
      for (const variant of product.variants) {
        if (variant.id === variantId) {
          return variant.images && variant.images.length > 0 ? index : 0;
        }
        index += variant.images?.length ?? 0;
      }
      return 0;
    },
    [product],
  );

  const handleImageScroll = useCallback(() => {
    if (!imageScrollRef.current) return;
    const scrollLeft = imageScrollRef.current.scrollLeft;
    const width = imageScrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  }, []);

  const scrollToImage = useCallback((index: number) => {
    if (!imageScrollRef.current) return;
    const width = imageScrollRef.current.clientWidth;
    imageScrollRef.current.scrollTo({ left: index * width, behavior: "smooth" });
  }, []);

  return {
    imageScrollRef,
    allImages,
    currentImageIndex,
    setCurrentImageIndex,
    getVariantImageIndex,
    handleImageScroll,
    scrollToImage,
  };
}
