"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useWishlistStore } from "@/stores/wishlist-store";

import type { Product } from "@/types/database";

export function useUndoSnackbar() {
  const items = useWishlistStore((s) => s.items);
  const insertItemAt = useWishlistStore((s) => s.insertItemAt);

  const [removedProduct, setRemovedProduct] = useState<{
    product: Product;
    index: number;
  } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const prevItemsRef = useRef<Product[]>(items);
  const snackbarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef(0);

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    prevItemsRef.current = items;

    if (prevItems.length > items.length) {
      const removedIndex = prevItems.findIndex(
        (prev) => !items.some((curr) => curr.id === prev.id),
      );
      if (removedIndex !== -1) {
        if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
        setRemovedProduct({ product: prevItems[removedIndex], index: removedIndex });
        setSnackbarVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setSnackbarVisible(true));
        });
        snackbarTimerRef.current = setTimeout(() => {
          setSnackbarVisible(false);
          setTimeout(() => setRemovedProduct(null), 500);
        }, 3000);
      }
    }
  }, [items]);

  const handleUndo = useCallback(() => {
    if (!removedProduct) return;
    insertItemAt(removedProduct.product, removedProduct.index);
    setSnackbarVisible(false);
    setTimeout(() => setRemovedProduct(null), 300);
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
  }, [removedProduct, insertItemAt]);

  const dismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
    setDragY(0);
    setIsDragging(false);
    setTimeout(() => setRemovedProduct(null), 300);
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    setIsDragging(true);
    setDragY(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setDragY(e.clientY - dragStartRef.current);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    if (Math.abs(dragY) > 60) dismissSnackbar();
    else setDragY(0);
    setIsDragging(false);
  }, [isDragging, dragY, dismissSnackbar]);

  return {
    removedProduct,
    snackbarVisible,
    dragY,
    isDragging,
    handleUndo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

export type UndoSnackbarState = ReturnType<typeof useUndoSnackbar>;
