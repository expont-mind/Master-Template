"use client";

import { useEffect, useState } from "react";
import { useUIStore, type Toast as ToastType } from "@/stores/ui-store";

// Toast styled to match the wishlist "хасагдлаа" snackbar
// (app/wishlist/page.tsx:645-657): white card, slate-200 border, no icon,
// no close button, slate-950 medium-weight title, optional slate-500 body.
// Position mirrors the same snackbar — bottom-center on mobile, top-right on
// desktop — so success / info messages feel native to the rest of the UI.

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);

  // Slide-in on mount, slide-out before unmount.
  useEffect(() => {
    const enter = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    const duration = toast.duration ?? 4000;
    const exit = setTimeout(() => setVisible(false), duration);
    const dismiss = setTimeout(() => removeToast(toast.id), duration + 500);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(exit);
      clearTimeout(dismiss);
    };
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-[calc(100%+40px)] md:-translate-y-[calc(100%+152px)] opacity-0"
      }`}
    >
      <div className="flex items-center gap-1.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 min-w-[320px] md:w-[356px]">
        <div className="flex-1 min-w-0">
          <p className="text-[#020617] font-medium text-sm font-manrope whitespace-nowrap">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[#64748B] font-normal text-xs font-manrope leading-4 mt-0.5">
              {toast.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 md:bottom-auto md:top-[136px] md:left-auto md:translate-x-0 md:right-[calc((100vw-1064px)/2)] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
