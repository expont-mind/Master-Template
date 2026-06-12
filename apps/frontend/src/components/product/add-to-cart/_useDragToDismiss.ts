"use client";

// Swipe/drag-to-dismiss state for mobile bottom-sheet drawers. Tracks
// touch start/move/end and reports the current drag offset. The drawer
// closes when the user releases past the 100px threshold.
//
// Refs mirror the React state to allow the touch handlers to be stable
// useCallbacks while still reading the current drag value.

import { useCallback, useRef, useState } from "react";

interface UseDragToDismissOptions {
  onClose: () => void;
  threshold?: number;
}

export function useDragToDismiss({ onClose, threshold = 100 }: UseDragToDismissOptions) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest("[data-scrollable]") as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    dragYRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY <= 0) {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragY(0);
      }
      return;
    }
    const target = e.target as HTMLElement;
    const scrollable = target.closest("[data-scrollable]") as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragYRef.current = deltaY;
    setDragY(deltaY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (dragYRef.current > threshold) {
      onClose();
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    dragYRef.current = 0;
  }, [onClose, threshold]);

  const drawerTouchProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    dragY,
    isDragging,
    drawerTouchProps,
  };
}
