"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { AppleIcon, GoogleIcon, FacebookIcon, X } from "../svg";

export interface ConnectionItem {
  id: string;
  name: string;
  displayName: string;
  icon: React.ReactNode;
  connected: boolean;
  hasBorder: boolean;
}

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAnimationEnd?: () => void;
  connection: ConnectionItem | null;
  isLoading?: boolean;
}

const getModalIcon = (connectionId: string) => {
  const iconProps = { size: 36, color: "#64748B" };
  switch (connectionId) {
    case "apple":
      return <AppleIcon {...iconProps} />;
    case "google":
      return <GoogleIcon {...iconProps} />;
    case "facebook":
      return <FacebookIcon {...iconProps} />;
    default:
      return <GoogleIcon {...iconProps} />;
  }
};

export const DisconnectModal = ({
  isOpen,
  onClose,
  onConfirm,
  onAnimationEnd,
  connection,
  isLoading = false,
}: DisconnectModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
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
        onAnimationEnd?.();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, onAnimationEnd, visible]);

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

  if (!visible || typeof window === "undefined" || !connection) return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white rounded-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] px-6 py-8 flex flex-col items-center gap-8 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center">
          {getModalIcon(connection.id)}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[#020617] font-semibold text-xl font-manrope text-center leading-7">
            {connection.displayName} холболт салах гэж байна
          </p>

          {/* Description */}
          <p className="text-[#64748B] font-normal text-base font-manrope text-center leading-6">
            Таны "{connection.displayName}" -ээр нэвтрэх холболт салах гэж
            байна. Итгэлтэй байна уу?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Салгаж байна..." : "Салгах"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
