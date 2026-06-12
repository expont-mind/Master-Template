import { useEffect } from "react";

/**
 * Locks body scroll when active. Works on iOS Safari, Android Chrome, and desktop.
 * Uses position:fixed approach to prevent iOS Safari from scrolling behind modals.
 * Also blocks touchmove on document to handle iOS keyboard-open scroll issues.
 *
 * Uses a global lock counter so overlapping modals (e.g. ReviewModal → RatingModal)
 * don't break scroll — it only unlocks when ALL consumers release.
 */

let lockCount = 0;
let savedScrollY = 0;

const preventTouchMove = (e: TouchEvent) => {
  let target = e.target as HTMLElement | null;
  while (target && target !== document.body) {
    const { overflowY } = getComputedStyle(target);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      target.scrollHeight > target.clientHeight
    ) {
      return;
    }
    target = target.parentElement;
  }
  e.preventDefault();
};

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const body = document.body;
    const html = document.documentElement;

    lockCount++;
    if (lockCount === 1) {
      savedScrollY = window.scrollY;
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${savedScrollY}px`;
      body.style.width = "100%";
      html.style.overflow = "hidden";
      document.addEventListener("touchmove", preventTouchMove, {
        passive: false,
      });
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.removeEventListener("touchmove", preventTouchMove);
        body.style.overflow = "";
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
        html.style.overflow = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
}
