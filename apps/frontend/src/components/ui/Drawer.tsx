"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { cn } from "@/lib/utils/cn";

import {
  drawerPositionClass,
  drawerSizeClass,
  type DrawerPosition,
  type DrawerSize,
} from "./_drawerStyles";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: DrawerPosition;
  size?: DrawerSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
}

interface DrawerHeaderProps {
  title?: string;
  showCloseButton: boolean;
  onClose: () => void;
}

function DrawerHeader({ title, showCloseButton, onClose }: DrawerHeaderProps) {
  if (!title && !showCloseButton) return null;
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
      {title && (
        <h2 id="drawer-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
      )}
      {showCloseButton && (
        <button
          onClick={onClose}
          className={cn(
            "rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
            !title && "ml-auto",
          )}
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = "right",
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: DrawerProps) {
  const focusTrapRef = useFocusTrap(isOpen);
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={focusTrapRef}
        className={cn(
          "absolute top-0 h-full bg-white shadow-xl dark:bg-zinc-900",
          drawerSizeClass(size),
          drawerPositionClass(position),
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        <DrawerHeader title={title} showCloseButton={showCloseButton} onClose={onClose} />

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );

  // Render in portal
  if (typeof window === "undefined") return null;
  return createPortal(drawerContent, document.body);
}
