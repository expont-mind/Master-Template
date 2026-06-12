"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { Logout } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
}

export const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut }: LogoutModalProps) => {
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
      if (e.key === "Escape" && !isLoggingOut) onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose, isLoggingOut]);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={() => !isLoggingOut && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 py-8 flex flex-col items-center gap-8 transition-all duration-200 mx-4"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-status-error-bg flex items-center justify-center">
          <Logout />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-2">
          <p className="text-text-primary font-semibold text-xl font-manrope text-center leading-7">
            Гарах уу?
          </p>
          <p className="text-text-secondary font-normal text-base font-manrope text-center leading-6">
            Та системээс гарахдаа итгэлтэй байна уу?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "Гарч байна..." : "Гарах"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
