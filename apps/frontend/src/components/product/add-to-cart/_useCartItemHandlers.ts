"use client";

import { useCallback } from "react";

import type { StagedCartItem } from "./_addToCartTypes";
import type { ProductVariant } from "@/types/product";

interface UseCartItemHandlersInput {
  variants: ProductVariant[] | null | undefined;
  setCartItems: React.Dispatch<React.SetStateAction<StagedCartItem[]>>;
  setMobilePhase: (p: "accordion" | "summary") => void;
  setExpandedGroupIndex: (i: number) => void;
  setSelectedOptions: (o: Record<string, string>) => void;
  setSelectedVariantId: (id: string | undefined) => void;
  setEditingCartItemId: (id: string | null) => void;
  slideTransition: (callback: () => void) => void;
}

export function useCartItemHandlers({
  variants,
  setCartItems,
  setMobilePhase,
  setExpandedGroupIndex,
  setSelectedOptions,
  setSelectedVariantId,
  setEditingCartItemId,
  slideTransition,
}: UseCartItemHandlersInput) {
  const handleCartItemQuantityChange = useCallback(
    (variantId: string, delta: number) => {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.variantId !== variantId) return item;
          const variant = variants?.find((v) => v.id === variantId);
          const stock = variant?.stock_quantity;
          let next = item.quantity + delta;
          next = Math.max(1, next);
          if (stock != null) next = Math.min(stock, next);
          return { ...item, quantity: next };
        }),
      );
    },
    [variants, setCartItems],
  );

  const handleRemoveCartItem = useCallback(
    (variantId: string) => {
      setCartItems((prev) => {
        const next = prev.filter((item) => item.variantId !== variantId);
        if (next.length === 0) {
          setMobilePhase("accordion");
          setExpandedGroupIndex(0);
          setSelectedOptions({});
          setSelectedVariantId(undefined);
        }
        return next;
      });
    },
    [setCartItems, setMobilePhase, setExpandedGroupIndex, setSelectedOptions, setSelectedVariantId],
  );

  const backToAccordion = useCallback(() => {
    slideTransition(() => {
      setEditingCartItemId(null);
      setSelectedOptions({});
      setSelectedVariantId(undefined);
      setMobilePhase("accordion");
      setExpandedGroupIndex(0);
    });
  }, [
    slideTransition,
    setEditingCartItemId,
    setSelectedOptions,
    setSelectedVariantId,
    setMobilePhase,
    setExpandedGroupIndex,
  ]);

  const editCartItem = useCallback(
    (variantId: string, options: Record<string, string>) => {
      slideTransition(() => {
        setEditingCartItemId(variantId);
        setSelectedOptions(options);
        setMobilePhase("accordion");
        setExpandedGroupIndex(0);
      });
    },
    [
      slideTransition,
      setEditingCartItemId,
      setSelectedOptions,
      setMobilePhase,
      setExpandedGroupIndex,
    ],
  );

  return {
    handleCartItemQuantityChange,
    handleRemoveCartItem,
    backToAccordion,
    editCartItem,
  };
}
