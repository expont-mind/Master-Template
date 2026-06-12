"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { Cancel } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { useEscapeKey, useModalLifecycle } from "./point-activation/_useModalLifecycle";
import { useSheetDrag } from "./point-activation/_useSheetDrag";
import { ActivateButton, PointActivationContent } from "./point-activation/PointActivationContent";

interface PointActivationProps {
  isOpen: boolean;
  hasPhone: boolean;
  onActivate: () => Promise<void>;
  onNavigateToPhone: () => void;
  onClose: () => void;
}

export const PointActivation = ({
  isOpen,
  hasPhone,
  onActivate,
  onNavigateToPhone,
  onClose,
}: PointActivationProps) => {
  const [activating, setActivating] = useState(false);
  const drag = useSheetDrag(onClose);
  const { visible, animate } = useModalLifecycle(isOpen, drag.resetDrag);

  useScrollLock(visible);
  useEscapeKey(visible, onClose);

  const handleActivate = async () => {
    if (!hasPhone) {
      onNavigateToPhone();
      return;
    }
    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  if (!visible || typeof window === "undefined") return null;

  const { dragY, isDragging } = drag;

  const overlayStyle = {
    opacity: isDragging ? Math.max(0, 1 - dragY / 300) : animate ? 1 : 0,
    transition: isDragging ? "none" : "opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
  };

  const sheetStyle = {
    transform: isDragging
      ? `translateY(${dragY}px)`
      : animate
        ? "translateY(0)"
        : "translateY(100%)",
    transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform" as const,
  };

  return createPortal(
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="fixed inset-0 z-999 flex flex-col justify-end md:hidden">
        <div
          className="absolute inset-0 bg-overlay touch-none"
          style={overlayStyle}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className="relative bg-white rounded-t-2xl flex flex-col h-[90vh] overflow-hidden"
          style={sheetStyle}
          role="dialog"
          aria-modal="true"
          onTouchStart={drag.handleTouchStart}
          onTouchMove={drag.handleTouchMove}
          onTouchEnd={drag.handleTouchEnd}
        >
          <div className="flex flex-col px-6 pt-6 gap-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <Cancel />
              </button>
            </div>

            <PointActivationContent />
          </div>

          <div className="mt-auto relative z-10 px-6 pb-10">
            <ActivateButton activating={activating} onClick={handleActivate} />
          </div>
        </div>
      </div>

      {/* Desktop: Centered Modal (unchanged) */}
      <div className="fixed inset-0 z-999 hidden md:flex items-center justify-center">
        <div
          className="absolute inset-0 bg-overlay transition-opacity duration-200"
          style={{ opacity: animate ? 1 : 0 }}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className="relative w-full max-w-[375px] h-[700px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 pt-6 pb-10 flex flex-col gap-4 overflow-hidden transition-all duration-200"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? "scale(1)" : "scale(0.95)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <Cancel />
            </button>
          </div>

          <PointActivationContent />

          <div className="mt-auto relative z-10">
            <ActivateButton activating={activating} onClick={handleActivate} />
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
