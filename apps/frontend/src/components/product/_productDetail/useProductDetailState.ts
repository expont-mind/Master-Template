"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDescriptionOverflow } from "@/components/product/detail/useDescriptionOverflow";
import { useProductImageGallery } from "@/components/product/detail/useProductImageGallery";
import { useProductScrollSpy } from "@/components/product/detail/useProductScrollSpy";
import { useStickyPanelPosition } from "@/components/product/detail/useStickyPanelPosition";
import { useProductDetail, useRelatedProducts } from "@/lib/hooks/useProductDetail";
import { useReviewSummary } from "@/lib/hooks/useReviews";
import { useUIStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import { useDefaultVariant } from "./useDefaultVariant";
import { useProductPricing } from "./useProductPricing";

import type { ProductWithDetails } from "@/lib/queries/products";

function useProductRelatedData(product: ProductWithDetails | null | undefined) {
  const productId = product?.id ?? "";
  const categoryPath = product?.categoryPath;
  const lastCategoryId = categoryPath?.[categoryPath.length - 1]?.id;
  const brandId = product?.brand?.id;

  const { data: reviewSummary } = useReviewSummary(productId);
  const { data: relatedProducts } = useRelatedProducts(productId, lastCategoryId, brandId);

  return { reviewSummary, relatedProducts };
}

function useProductWishlist(product: ProductWithDetails | null | undefined) {
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const userId = useWishlistStore((s) => s.userId);
  const openLogin = useUIStore((s) => s.openLogin);
  const showTopHeader = useUIStore((s) => s.showTopHeader);
  const wishlisted = useWishlistStore(
    (s) => s.isHydrated && !!product && s.items.some((item) => item.id === product.id),
  );
  return { toggleWishlist, userId, openLogin, showTopHeader, wishlisted };
}

function useProductModalState() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReviewsDrawerOpen, setIsReviewsDrawerOpen] = useState(false);
  return {
    isModalOpen,
    setIsModalOpen,
    isImageModalOpen,
    setIsImageModalOpen,
    isReviewsDrawerOpen,
    setIsReviewsDrawerOpen,
  };
}

/**
 * Aggregates every piece of state + every hook used by the product
 * detail page so the rendering component can focus on layout only.
 *
 * Owns the section refs so the scroll-spy and sticky hooks see stable
 * ref objects across re-renders, then passes them out for the child
 * components to attach.
 */
export function useProductDetailState(
  slug: string,
  serverProduct: ProductWithDetails | null | undefined,
) {
  const { data: product, isLoading, isFetching } = useProductDetail(slug, serverProduct);
  const { reviewSummary, relatedProducts } = useProductRelatedData(product);

  const [quantity, setQuantity] = useState(1);
  const { defaultVariantId, variantsReady } = useDefaultVariant(product, isFetching);
  const [userSelectedVariantId, setUserSelectedVariantId] = useState<string | undefined>(undefined);
  const selectedVariantId = userSelectedVariantId ?? defaultVariantId;

  const modalState = useProductModalState();
  const [descExpanded, setDescExpanded] = useState(false);

  const briefRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const {
    imageScrollRef,
    allImages,
    currentImageIndex,
    setCurrentImageIndex,
    getVariantImageIndex,
    handleImageScroll,
    scrollToImage,
  } = useProductImageGallery(product);

  const { activeTab, scrollToSection } = useProductScrollSpy({
    briefRef,
    detailsRef,
    reviewsRef,
    tabsRef,
    resetKey: product,
  });

  const stickyTop = useStickyPanelPosition({
    panelRef: rightPanelRef,
    deps: [product, selectedVariantId],
  });

  const {
    ref: descRef,
    overflows: descOverflows,
    fullHeight: descFullHeight,
  } = useDescriptionOverflow({
    deps: [product?.description, selectedVariantId, product?.variants],
  });

  // Sync image index when default variant is computed (first load)
  useEffect(() => {
    if (defaultVariantId && !userSelectedVariantId) {
      setCurrentImageIndex(getVariantImageIndex(defaultVariantId));
    }
  }, [defaultVariantId, userSelectedVariantId, getVariantImageIndex, setCurrentImageIndex]);

  const handleVariantChange = useCallback(
    (variantId: string) => {
      setUserSelectedVariantId(variantId);
      setQuantity(1);
      setDescExpanded(false);

      const targetIndex = getVariantImageIndex(variantId);
      setCurrentImageIndex(targetIndex);

      if (imageScrollRef.current) {
        const width = imageScrollRef.current.clientWidth;
        imageScrollRef.current.scrollTo({
          left: targetIndex * width,
          behavior: "smooth",
        });
      }
    },
    [getVariantImageIndex, setCurrentImageIndex, imageScrollRef],
  );

  const { toggleWishlist, userId, openLogin, showTopHeader, wishlisted } =
    useProductWishlist(product);

  const pricing = useProductPricing(product, selectedVariantId);

  return {
    // data
    product,
    isLoading,
    reviewSummary,
    relatedProducts,
    pricing,
    // selection state
    quantity,
    setQuantity,
    selectedVariantId,
    handleVariantChange,
    variantsReady,
    // modals
    ...modalState,
    // description state
    descExpanded,
    setDescExpanded,
    descRef,
    descOverflows,
    descFullHeight,
    // refs
    briefRef,
    detailsRef,
    reviewsRef,
    tabsRef,
    rightPanelRef,
    // gallery
    imageScrollRef,
    allImages,
    currentImageIndex,
    setCurrentImageIndex,
    handleImageScroll,
    scrollToImage,
    // scroll spy
    activeTab,
    scrollToSection,
    stickyTop,
    // wishlist + auth
    toggleWishlist,
    userId,
    openLogin,
    showTopHeader,
    wishlisted,
  };
}
