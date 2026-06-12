"use client";

import { type UndoSnackbarState } from "@/app/wishlist/_hooks/useUndoSnackbar";

function dragStyle(isDragging: boolean, dragY: number): React.CSSProperties | undefined {
  if (!isDragging) return undefined;
  return {
    transform: `translateY(${dragY}px)`,
    opacity: Math.max(0, 1 - Math.abs(dragY) / 120),
    transition: "none",
  };
}

function snackbarClass(isDragging: boolean, snackbarVisible: boolean): string {
  const base = "touch-none select-none cursor-grab active:cursor-grabbing";
  if (isDragging) return base;
  const motion = snackbarVisible
    ? "translate-y-0 opacity-100"
    : "translate-y-[calc(100%+40px)] md:-translate-y-[calc(100%+152px)] opacity-0";
  return `${base} transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${motion}`;
}

export function UndoSnackbar({ snackbar }: { snackbar: UndoSnackbarState }) {
  if (!snackbar.removedProduct) return null;
  return (
    <div className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 md:bottom-auto md:top-[136px] md:left-auto md:translate-x-0 md:right-[calc((100vw-1064px)/2)]">
      <div
        onPointerDown={snackbar.handlePointerDown}
        onPointerMove={snackbar.handlePointerMove}
        onPointerUp={snackbar.handlePointerUp}
        onPointerCancel={snackbar.handlePointerUp}
        style={dragStyle(snackbar.isDragging, snackbar.dragY)}
        className={snackbarClass(snackbar.isDragging, snackbar.snackbarVisible)}
      >
        <div className="flex items-center gap-1.5 bg-white rounded-[10px] border border-border shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 min-w-[320px] md:w-[356px]">
          <p className="text-text-primary font-medium text-sm font-manrope whitespace-nowrap flex-1">
            Хадгалсан -аас хасагдлаа
          </p>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={snackbar.handleUndo}
            className="bg-slate-900 text-white font-medium text-xs leading-6 font-manrope px-2 rounded-[10px] h-6 cursor-pointer hover:bg-surface-dark transition-colors duration-200 whitespace-nowrap"
          >
            Буцаах
          </button>
        </div>
      </div>
    </div>
  );
}
