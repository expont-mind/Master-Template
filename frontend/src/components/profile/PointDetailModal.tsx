"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel } from "../svg";
import { MPointBadge } from "../svg";

interface PointDetailData {
  orderId: string | null;
  orderNumber: string | null;
  balanceBefore: number;
  used: number;
  earned: number;
  balanceAfter: number;
  description: string;
}

interface PointDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PointDetailData | null;
}

export const PointDetailModal = ({
  isOpen,
  onClose,
  data,
}: PointDetailModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
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

  if (!visible || typeof window === "undefined" || !data) return null;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        {data.orderNumber ? (
          <p className="text-[#020617] font-bold text-xl font-manrope underline underline-offset-2">
            #{data.orderNumber}
          </p>
        ) : (
          <p className="text-[#020617] font-bold text-xl font-manrope">
            Дэлгэрэнгүй
          </p>
        )}
        <button
          onClick={onClose}
          className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
        >
          <Cancel />
        </button>
      </div>

      <div className="flex flex-col pb-5 md:py-5 gap-6">
        {/* Balance Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-semibold text-sm font-manrope">
              Эхний үлдэгдэл:
            </p>
            <div className="flex items-center gap-1">
              <p className="text-[#020617] font-semibold text-sm font-manrope">
                {data.balanceBefore.toLocaleString()}
              </p>
              <MPointBadge />
            </div>
          </div>

          {data.used !== 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[#64748B] font-normal text-sm font-manrope">
                Ашигласан:
              </p>
              <div className="flex items-center gap-1">
                <p className="text-rose-500 font-semibold text-sm font-manrope">
                  -{Math.abs(data.used).toLocaleString()}
                </p>
                <MPointBadge />
              </div>
            </div>
          )}

          {data.earned !== 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[#64748B] font-normal text-sm font-manrope">
                Нэмэгдсэн:
              </p>
              <div className="flex items-center gap-1">
                <p className="text-teal-500 font-semibold text-sm font-manrope">
                  +{data.earned.toLocaleString()}
                </p>
                <MPointBadge />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-semibold text-sm font-manrope">
              Эцсийн үлдэгдэл:
            </p>
            <div className="flex items-center gap-1">
              <p className="text-[#020617] font-semibold text-sm font-manrope">
                {data.balanceAfter.toLocaleString()}
              </p>
              <MPointBadge />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* Description */}
        <div className="flex flex-col gap-1 pb-4">
          <p className="text-[#020617] font-semibold text-sm font-manrope">
            Гүйлгээний тайлбар:
          </p>
          <p className="text-[#64748B] font-normal text-sm font-manrope leading-5 py-0.5">
            {data.description}
          </p>
        </div>
      </div>
    </>
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
              : "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bottom Sheet */}
        <div
          className="relative bg-white rounded-t-2xl flex flex-col h-[60vh] overflow-y-auto p-6 gap-6"
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
          {content}
        </div>
      </div>

      {/* Desktop: Centered Modal */}
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
          className="relative w-full max-w-[375px] mx-4 bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 flex flex-col gap-6 transition-all duration-200"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? "scale(1)" : "scale(0.95)",
          }}
          role="dialog"
          aria-modal="true"
        >
          {content}

          {/* Close Button */}
          <div className="w-full pb-1.5">
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
