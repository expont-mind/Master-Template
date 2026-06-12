"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  useEscapeKey,
  useModalLifecycle,
} from "@/components/profile/point-activation/_useModalLifecycle";
import { Cancel, ChevronRightProduct, Plus } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { AddressSelectItem } from "./_AddressSelectItem";

import type { AddressWithId } from "@/lib/hooks/useCheckout";

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
  const noop = () => {};
  const { visible, animate } = useModalLifecycle(isOpen, noop, 200);
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(null);

  useScrollLock(visible);
  useEscapeKey(visible, onClose);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset temp selection to current value each time the modal opens
    if (isOpen) setTempSelectedId(selectedAddressId);
  }, [isOpen, selectedAddressId]);

  if (!visible || typeof window === "undefined") return null;

  const handleConfirm = () => {
    const addr = addresses.find((a) => a.id === tempSelectedId);
    if (addr) onSelect(addr);
    onClose();
  };

  const handleAddNew = () => {
    onClose();
    onAddNew();
  };

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-[calc(100%-32px)] md:w-full max-w-[444px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        <div className="flex items-center justify-between">
          <PrimaryHeading>Хаяг сонгох</PrimaryHeading>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px]">
            {addresses.map((addr) => (
              <AddressSelectItem
                key={addr.id}
                addr={addr}
                isSelected={addr.id === tempSelectedId}
                onSelect={() => setTempSelectedId(addr.id)}
                onEdit={() => {
                  onClose();
                  onEdit(addr);
                }}
              />
            ))}
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-text-primary font-normal text-base font-manrope cursor-pointer"
          >
            <span className="md:hidden flex items-center gap-0.5">
              <Plus size={20} />
              <span className="underline underline-offset-4 decoration-[0.96px]">Хаяг нэмэх</span>
            </span>
            <span className="hidden md:flex items-center gap-0.5">
              <span className="underline underline-offset-4 decoration-[0.96px]">
                Хаяг нэмэх, засах, устгах
              </span>
              <ChevronRightProduct />
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 md:justify-end md:gap-3">
          <button
            onClick={onClose}
            className="flex-1 md:flex-none px-3 py-2.5 h-11 border border-border rounded-sm text-text-primary font-normal text-base font-manrope cursor-pointer hover:bg-surface transition-colors duration-200"
          >
            <span className="px-0.5">Болих</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 md:flex-none px-3 py-2.5 h-11 bg-text-primary rounded-sm text-white font-normal text-base font-manrope cursor-pointer hover:bg-surface-dark transition-colors duration-200"
          >
            <span className="px-0.5 md:hidden">Сонгох</span>
            <span className="px-0.5 hidden md:inline">Хадгалах</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
