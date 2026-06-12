"use client";

import { createPortal } from "react-dom";

import { Cancel, MPointBadge } from "@/components/svg";
import { MutedTextSm, PrimarySemiboldSm } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { useEscapeKey, useModalLifecycle } from "./point-activation/_useModalLifecycle";
import { useSheetDrag } from "./point-activation/_useSheetDrag";

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

function computeOverlayStyle(isDragging: boolean, dragY: number, animate: boolean) {
  return {
    opacity: isDragging ? Math.max(0, 1 - dragY / 300) : animate ? 1 : 0,
    transition: isDragging ? "none" : "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
  };
}

function computeSheetStyle(isDragging: boolean, dragY: number, animate: boolean) {
  return {
    transform: isDragging
      ? `translateY(${dragY}px)`
      : animate
        ? "translateY(0)"
        : "translateY(100%)",
    transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform" as const,
  };
}

function PointDetailBody({ data, onClose }: { data: PointDetailData; onClose: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between">
        {data.orderNumber ? (
          <p className="text-text-primary font-bold text-xl font-manrope underline underline-offset-2">
            #{data.orderNumber}
          </p>
        ) : (
          <p className="text-text-primary font-bold text-xl font-manrope">Дэлгэрэнгүй</p>
        )}
        <button
          onClick={onClose}
          className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
        >
          <Cancel />
        </button>
      </div>

      <div className="flex flex-col pb-5 md:py-5 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <PrimarySemiboldSm>Эхний үлдэгдэл:</PrimarySemiboldSm>
            <div className="flex items-center gap-1">
              <PrimarySemiboldSm>{data.balanceBefore.toLocaleString()}</PrimarySemiboldSm>
              <MPointBadge />
            </div>
          </div>

          {data.used !== 0 && (
            <div className="flex items-center justify-between">
              <MutedTextSm>Ашигласан:</MutedTextSm>
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
              <MutedTextSm>Нэмэгдсэн:</MutedTextSm>
              <div className="flex items-center gap-1">
                <p className="text-teal-500 font-semibold text-sm font-manrope">
                  +{data.earned.toLocaleString()}
                </p>
                <MPointBadge />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <PrimarySemiboldSm>Эцсийн үлдэгдэл:</PrimarySemiboldSm>
            <div className="flex items-center gap-1">
              <PrimarySemiboldSm>{data.balanceAfter.toLocaleString()}</PrimarySemiboldSm>
              <MPointBadge />
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        <div className="flex flex-col gap-1 pb-4">
          <PrimarySemiboldSm>Гүйлгээний тайлбар:</PrimarySemiboldSm>
          <p className="text-text-secondary font-normal text-sm font-manrope leading-5 py-0.5">
            {data.description}
          </p>
        </div>
      </div>
    </>
  );
}

export const PointDetailModal = ({ isOpen, onClose, data }: PointDetailModalProps) => {
  const drag = useSheetDrag(onClose);
  const { visible, animate } = useModalLifecycle(isOpen, drag.resetDrag);

  useScrollLock(visible);
  useEscapeKey(visible, onClose);

  if (!visible || typeof window === "undefined" || !data) return null;

  const { dragY, isDragging } = drag;
  const overlayStyle = computeOverlayStyle(isDragging, dragY, animate);
  const sheetStyle = computeSheetStyle(isDragging, dragY, animate);

  return createPortal(
    <>
      <div className="fixed inset-0 z-999 flex flex-col justify-end md:hidden">
        <div
          className="absolute inset-0 bg-overlay touch-none"
          style={overlayStyle}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className="relative bg-white rounded-t-2xl flex flex-col h-[60vh] overflow-y-auto p-6 gap-6"
          style={sheetStyle}
          role="dialog"
          aria-modal="true"
          onTouchStart={drag.handleTouchStart}
          onTouchMove={drag.handleTouchMove}
          onTouchEnd={drag.handleTouchEnd}
        >
          <PointDetailBody data={data} onClose={onClose} />
        </div>
      </div>

      <div className="fixed inset-0 z-999 hidden md:flex items-center justify-center">
        <div
          className="absolute inset-0 bg-overlay transition-opacity duration-200"
          style={{ opacity: animate ? 1 : 0 }}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className="relative w-full max-w-[375px] mx-4 bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 flex flex-col gap-6 transition-all duration-200"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? "scale(1)" : "scale(0.95)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <PointDetailBody data={data} onClose={onClose} />
          <div className="w-full pb-1.5">
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
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
