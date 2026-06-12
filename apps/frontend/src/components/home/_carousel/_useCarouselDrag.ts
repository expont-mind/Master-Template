"use client";

import { useRef, useState } from "react";

const DRAG_THRESHOLD = 40;
const VELOCITY_THRESHOLD = 0.3;
export const SNAP_TRANSITION = "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)";

export interface DragRefState {
  active: boolean;
  startX: number;
  offset: number;
  lastOffset: number;
  velocity: number;
  lastX: number;
  lastTime: number;
}

interface UseCarouselDragArgs {
  currentSlide: number;
  slidesLength: number;
  slideWidth: number;
  gap: number;
  isMobile: boolean;
  setCurrentSlide: (n: number) => void;
  setProgress: (n: number) => void;
  trackRef: React.RefObject<HTMLDivElement | null>;
}

function buildTransform(
  slideIdx: number,
  extra: number,
  slideWidth: number,
  gap: number,
  isMobile: boolean,
): string {
  const base = (slideWidth + gap) * slideIdx;
  return isMobile
    ? `translateX(calc(50% - ${slideWidth / 2}px - ${base}px + ${extra}px))`
    : `translateX(${-base + extra}px)`;
}

function decideNextSlide(current: number, total: number, offset: number, velocity: number): number {
  const swipeByVelocity = Math.abs(velocity) > VELOCITY_THRESHOLD;
  const swipeByDistance = Math.abs(offset) > DRAG_THRESHOLD;
  if (!swipeByVelocity && !swipeByDistance) return current;
  const direction = swipeByVelocity ? velocity : offset;
  if (direction > 0 && current > 0) return current - 1;
  if (direction < 0 && current < total - 1) return current + 1;
  return current;
}

export function useCarouselDrag({
  currentSlide,
  slidesLength,
  slideWidth,
  gap,
  isMobile,
  setCurrentSlide,
  setProgress,
  trackRef,
}: UseCarouselDragArgs) {
  const dragRef = useRef<DragRefState>({
    active: false,
    startX: 0,
    offset: 0,
    lastOffset: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
  });
  const rafRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const getTransform = (slideIdx: number, extra: number) =>
    buildTransform(slideIdx, extra, slideWidth, gap, isMobile);

  const handleDragStart = (clientX: number) => {
    const now = Date.now();
    dragRef.current = {
      active: true,
      startX: clientX,
      offset: 0,
      lastOffset: 0,
      velocity: 0,
      lastX: clientX,
      lastTime: now,
    };
    setIsDragging(true);
  };

  const updateVelocity = (clientX: number, now: number) => {
    const d = dragRef.current;
    const dt = now - d.lastTime;
    if (dt > 0) {
      const instant = (clientX - d.lastX) / dt;
      d.velocity = d.velocity * 0.6 + instant * 0.4;
    }
    d.lastX = clientX;
    d.lastTime = now;
  };

  const applyRubberBand = (rawOffset: number) => {
    const atStart = currentSlide === 0 && rawOffset > 0;
    const atEnd = currentSlide === slidesLength - 1 && rawOffset < 0;
    return atStart || atEnd ? rawOffset * 0.3 : rawOffset;
  };

  const handleDragMove = (clientX: number) => {
    const d = dragRef.current;
    if (!d.active) return;
    updateVelocity(clientX, Date.now());
    d.offset = applyRubberBand(clientX - d.startX);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none";
        trackRef.current.style.transform = getTransform(currentSlide, d.offset);
      }
    });
  };

  const handleDragEnd = () => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    d.lastOffset = d.offset;
    cancelAnimationFrame(rafRef.current);
    setIsDragging(false);

    if (trackRef.current) {
      trackRef.current.style.transition = SNAP_TRANSITION;
    }

    const newSlide = decideNextSlide(currentSlide, slidesLength, d.offset, d.velocity);
    d.offset = 0;
    d.velocity = 0;
    if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
      setProgress(0);
    } else if (trackRef.current) {
      trackRef.current.style.transform = getTransform(currentSlide, 0);
    }
  };

  return { isDragging, dragRef, handleDragStart, handleDragMove, handleDragEnd };
}
