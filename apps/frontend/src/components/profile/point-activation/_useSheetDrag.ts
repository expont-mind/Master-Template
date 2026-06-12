"use client";

import { useCallback, useRef, useState } from "react";

interface UseSheetDragResult {
  dragY: number;
  isDragging: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  resetDrag: () => void;
}

/**
 * Touch-drag-to-dismiss state for a bottom sheet. Caller decides what to
 * do when the drag exceeds the threshold (typically `onClose`).
 *
 * Mirrors the previous inline touch handling in PointActivation.tsx — only
 * accepts downward drags, ignores drags that start in a scrolled
 * `[data-scrollable]` element.
 */
export function useSheetDrag(onDismiss: () => void): UseSheetDragResult {
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
    if (dragYRef.current > 100) {
      onDismiss();
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    dragYRef.current = 0;
  }, [onDismiss]);

  const resetDrag = useCallback(() => {
    isDraggingRef.current = false;
    dragYRef.current = 0;
    setIsDragging(false);
    setDragY(0);
  }, []);

  return {
    dragY,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetDrag,
  };
}
