"use client";

import { useEffect, useState } from "react";

interface UseAutoAdvanceArgs {
  isPaused: boolean;
  isDragging: boolean;
  slidesLength: number;
}

export function useAutoAdvance({ isPaused, isDragging, slidesLength }: UseAutoAdvanceArgs) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  // Tick progress and advance the slide on overflow. Both updates happen
  // inside the setInterval callback (async), so they don't count as
  // setState-in-effect-body.
  useEffect(() => {
    if (isPaused || isDragging || slidesLength === 0) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev + 2 >= 100) {
          setCurrentSlide((curr) => (curr + 1) % slidesLength);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused, isDragging, slidesLength]);

  return { currentSlide, setCurrentSlide, progress, setProgress };
}
