"use client";

import { useState } from "react";

import { useReviewSummary } from "@/lib/hooks/useReviews";
import { useUIStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import type { Product } from "@/types/database";

export function useProductCard(product: Product | undefined) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const userId = useWishlistStore((s) => s.userId);
  const openLogin = useUIStore((s) => s.openLogin);
  const wishlisted = useWishlistStore(
    (s) => s.isHydrated && !!product && s.items.some((item) => item.id === product.id),
  );
  const { data: reviewSummary } = useReviewSummary(product?.id ?? "");

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    if (!userId) {
      openLogin();
      return;
    }
    toggleWishlist(product);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    wishlisted,
    reviewSummary,
    handleToggleWishlist,
  };
}
