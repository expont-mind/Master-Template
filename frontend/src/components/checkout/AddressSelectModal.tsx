"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel, ChevronRightProduct, Plus } from "@/components/svg";
import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
} from "@/components/checkout/constants";
import type { AddressWithId } from "@/lib/hooks/useCheckout";
import { PrimaryHeading } from "@/components/ui/typography";

interface AddressSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: AddressWithId[];
  selectedAddressId: string | null;
  onSelect: (address: AddressWithId) => void;
  onEdit: (address: AddressWithId) => void;
  onAddNew: () => void;
}

export function AddressSelectModal({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelect,
  onEdit,
  onAddNew,
}: AddressSelectModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(null);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTempSelectedId(selectedAddressId);
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
  }, [isOpen, selectedAddressId]);

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

  const getCityLabel = (value: string) =>
    CITY_OPTIONS.find((o) => o.value === value)?.label || value;
  const getDistrictLabel = (value: string) =>
    DISTRICT_OPTIONS.find((o) => o.value === value)?.label || value;
  const getKhorooLabel = (value: string) =>
    KHOROO_OPTIONS.find((o) => o.value === value)?.label || value;

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-[calc(100%-32px)] md:w-full max-w-[444px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>
            Хаяг сонгох
          </PrimaryHeading>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Address List */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px]">
            {addresses.map((addr) => {
              const isSelected = addr.id === tempSelectedId;
              return (
                <div
                  key={addr.id}
                  onClick={() => setTempSelectedId(addr.id)}
                  className={`w-full flex items-center gap-4 py-4 pl-4 pr-2 border rounded-sm transition-colors duration-200 cursor-pointer ${isSelected ? "border-[#020617]" : "border-[#E2E8F0]"} md:border-[#E2E8F0] md:hover:border-[#CBD5E1]`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTempSelectedId(addr.id);
                    }
                  }}
                >
                  <div className="p-1 border border-[#E2E8F0] rounded-full shadow-[0_1px_2px_0_rgba(0,0,0,0.10)]">
                    <div
                      className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#020617]" : "bg-white"}`}
                    ></div>
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Mobile: comma-separated, truncate */}
                    <p className="text-[#64748B] font-medium text-base font-manrope truncate md:hidden">
                      {addr.city}, {addr.district}, {addr.sub_district}
                    </p>
                    {/* Desktop: with labels */}
                    <p className="text-[#64748B] font-medium text-base font-manrope truncate hidden md:block">
                      {getCityLabel(addr.city)} хот,{" "}
                      {getDistrictLabel(addr.district)} дүүрэг,{" "}
                      {getKhorooLabel(addr.sub_district)}
                    </p>

                    <p className="text-[#020617] text-start font-medium text-base md:text-lg font-manrope md:leading-7 truncate md:line-clamp-2">
                      {addr.detail}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onEdit(addr);
                    }}
                    className="shrink-0 p-1 text-[#64748B] font-normal text-sm font-manrope cursor-pointer hover:text-[#020617] transition-colors duration-200"
                  >
                    <span className="px-0.5">Засах</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add New Address — Mobile: Plus icon + "Хаяг нэмэх" */}
          <button
            onClick={() => {
              onClose();
              onAddNew();
            }}
            className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-[#020617] font-normal text-base font-manrope cursor-pointer"
          >
            {/* Mobile */}
            <span className="md:hidden flex items-center gap-0.5">
              <Plus size={20} />
              <span className="underline underline-offset-4 decoration-[0.96px]">
                Хаяг нэмэх
              </span>
            </span>
            {/* Desktop */}
            <span className="hidden md:flex items-center gap-0.5">
              <span className="underline underline-offset-4 decoration-[0.96px]">
                Хаяг нэмэх, засах, устгах
              </span>
              <ChevronRightProduct />
            </span>
          </button>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-2.5 md:justify-end md:gap-3">
          <button
            onClick={onClose}
            className="flex-1 md:flex-none px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm text-[#020617] font-normal text-base font-manrope cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
          >
            <span className="px-0.5">Болих</span>
          </button>
          <button
            onClick={() => {
              const addr = addresses.find((a) => a.id === tempSelectedId);
              if (addr) onSelect(addr);
              onClose();
            }}
            className="flex-1 md:flex-none px-3 py-2.5 h-11 bg-[#020617] rounded-sm text-white font-normal text-base font-manrope cursor-pointer hover:bg-[#1E293B] transition-colors duration-200"
          >
            {/* Mobile: Сонгох, Desktop: Хадгалах */}
            <span className="px-0.5 md:hidden">Сонгох</span>
            <span className="px-0.5 hidden md:inline">Хадгалах</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
