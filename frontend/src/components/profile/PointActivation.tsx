"use client";

import { BRAND } from "@/lib/utils/brand-config";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel } from "../svg";
import Image from "next/image";

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
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [activating, setActivating] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragYRef = useRef(0);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setDragY(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => {
        setVisible(false);
        setDragY(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, visible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest(
      "[data-scrollable]",
    ) as HTMLElement | null;
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
    const scrollable = target.closest(
      "[data-scrollable]",
    ) as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragYRef.current = deltaY;
    setDragY(deltaY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (dragYRef.current > 100) {
      onClose();
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    dragYRef.current = 0;
  }, [onClose]);

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

  const activateButton = (
    <div className="relative z-10">
      <button
        onClick={handleActivate}
        disabled={activating}
        className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {activating ? "Идэвхжүүлж байна..." : "Идэвхжүүлэх"}
      </button>
    </div>
  );

  return createPortal(
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="fixed inset-0 z-999 flex flex-col justify-end md:hidden">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-[rgba(2,6,23,0.30)] touch-none"
          style={{
            opacity: isDragging
              ? Math.max(0, 1 - dragY / 300)
              : animate
                ? 1
                : 0,
            transition: isDragging
              ? "none"
              : "opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bottom Sheet */}
        <div
          className="relative bg-white rounded-t-2xl flex flex-col h-[90vh] overflow-hidden"
          style={{
            transform: isDragging
              ? `translateY(${dragY}px)`
              : animate
                ? "translateY(0)"
                : "translateY(100%)",
            transition: isDragging
              ? "none"
              : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            willChange: "transform",
          }}
          role="dialog"
          aria-modal="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Content */}
          <div className="flex flex-col px-6 pt-6 gap-4">
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <Cancel />
              </button>
            </div>

            <div className="flex flex-col items-start w-full gap-4">
              <h2 className="text-[#020617] font-bold text-3xl font-manrope leading-9">
                {BRAND.name} Point -оо
                <br />
                идэвхжүүлээрэй
              </h2>
              <p className="text-[#64748B] font-normal text-base font-manrope leading-6">
                Худалдан авалт бүрээс
                <br />
                <span className="text-[#020617] font-bold">
                  2% {BRAND.name} point
                </span>{" "}
                цуглуулаарай
              </p>
            </div>
          </div>

          {/* Phone mockup - absolute like desktop */}
          <div className="absolute -bottom-5 -right-[192px] w-[727px] h-[544px] pointer-events-none">
            <Image
              src="/iPhone.png"
              alt={`${BRAND.name} Point`}
              fill
              className="object-contain"
            />
          </div>

          {/* Bottom gradient over image */}
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-linear-to-t from-white from-[100px] to-transparent pointer-events-none" />

          {/* Activate Button - pinned to bottom */}
          <div className="mt-auto relative z-10 px-6 pb-10">
            {activateButton}
          </div>
        </div>
      </div>

      {/* Desktop: Centered Modal (unchanged) */}
      <div className="fixed inset-0 z-999 hidden md:flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
          style={{ opacity: animate ? 1 : 0 }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-[375px] h-[700px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 pt-6 pb-10 flex flex-col gap-4 overflow-hidden transition-all duration-200"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? "scale(1)" : "scale(0.95)",
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <Cancel />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-start w-full gap-4">
            <h2 className="text-[#020617] font-bold text-3xl font-manrope leading-9">
              {BRAND.name} Point -оо
              <br />
              идэвхжүүлээрэй
            </h2>
            <p className="text-[#64748B] font-normal text-base font-manrope leading-6">
              Худалдан авалт бүрээс
              <br />
              <span className="text-[#020617] font-bold">
                2% {BRAND.name} point
              </span>{" "}
              цуглуулаарай
            </p>
          </div>

          {/* Phone mockup - absolute */}
          <div className="absolute -bottom-5 -right-[192px] w-[727px] h-[544px] pointer-events-none">
            <Image
              src="/iPhone.png"
              alt={`${BRAND.name} Point`}
              fill
              className="object-contain"
            />
          </div>

          {/* Bottom gradient over image */}
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-linear-to-t from-white from-[100px] to-transparent pointer-events-none" />

          {/* Activate Button - pinned to bottom */}
          <div className="mt-auto relative z-10">{activateButton}</div>
        </div>
      </div>
    </>,
    document.body,
  );
};
