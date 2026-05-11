"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel, Search } from "../svg";
import { PrimaryHeading } from "@/components/ui/typography";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
}

export const SelectModal = ({
  isOpen,
  onClose,
  title,
  options,
  value,
  onSelect,
}: SelectModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [search, setSearch] = useState("");

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setSearch("");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

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

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [search, options]);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>
            Сонгох
          </PrimaryHeading>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Field Label */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <p className="text-[#020617] py-3 pr-2 pl-0.5 font-semibold text-base font-manrope">
              {title}
            </p>

            {/* Search Input */}
            <div className="flex items-center gap-0.5 p-1.5 border border-[#E2E8F0] rounded-full">
              <div className="p-1.5">
                <Search />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Хайх"
                className="w-full bg-white text-sm font-manrope placeholder:text-[#64748B] text-[#020617] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col max-h-[392px] overflow-y-auto">
            {/* Selected Chip */}
            {selectedLabel && (
              <div className="flex items-center sticky top-0 z-10 bg-white">
                <span className="px-3 h-8 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[#64748B] font-medium text-sm font-manrope">
                  {selectedLabel}
                </span>
              </div>
            )}

            {filtered.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className="text-left py-2 px-0.5 font-manrope text-base cursor-pointer transition-colors duration-150 text-[#020617] font-medium hover:text-[#64748B]"
              >
                {option.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-[#94A3B8] text-sm font-manrope text-center">
                Илэрц олдсонгүй
              </p>
            )}
          </div>
        </div>

        {/* Options List */}
      </div>
    </div>,
    document.body,
  );
};
