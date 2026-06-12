"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { GiftBox, MPointLogo } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { BRAND } from "@/lib/utils/brand-config";

interface PointGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBalance: () => void;
  amount: number;
  description?: string;
}

export const PointGiftModal = ({
  isOpen,
  onClose,
  onViewBalance,
  amount,
  description,
}: PointGiftModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 200);
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

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 py-8 flex flex-col items-center gap-8 transition-all duration-200 mx-4 md:mx-0"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-500">
          <GiftBox />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <p className="text-text-primary font-semibold text-xl font-manrope text-center leading-7">
              Та
            </p>
            <div className="flex items-center gap-0.5">
              <MPointLogo />
              <p className="text-text-primary font-semibold text-xl font-manrope text-center leading-7">
                Point бэлгэнд авлаа
              </p>
            </div>
          </div>
          <p className="text-text-secondary font-normal text-base font-manrope text-center leading-6">
            {description ||
              `${BRAND.name}-с танд ${amount.toLocaleString()} ${BRAND.name} point бэлэглэлээ.`}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={onViewBalance}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
          >
            Үлдэгдэл харах
          </button>
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
