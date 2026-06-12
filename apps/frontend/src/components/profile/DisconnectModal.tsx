"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { AppleIcon, GoogleIcon, FacebookIcon } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal enter animation: mount, then double-RAF before applying transition
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
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
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
        <div className="w-14 h-14 rounded-full bg-border-light flex items-center justify-center">
          {getModalIcon(connection.id)}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-text-primary font-semibold text-xl font-manrope text-center leading-7">
            {connection.displayName} холболт салах гэж байна
          </p>

          {/* Description */}
          <p className="text-text-secondary font-normal text-base font-manrope text-center leading-6">
            Таны &quot;{connection.displayName}&quot; -ээр нэвтрэх холболт салах гэж байна. Итгэлтэй
            байна уу?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Салгаж байна..." : "Салгах"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
