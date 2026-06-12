"use client";

import { createPortal } from "react-dom";

import {
  useEscapeKey,
  useModalLifecycle,
} from "@/components/profile/point-activation/_useModalLifecycle";
import { Cancel, Search } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { AddressOptionsList } from "./address-multistep/_AddressOptionsList";
import { AddressStepBreadcrumbs } from "./address-multistep/_AddressStepBreadcrumbs";
import { useAddressStepState } from "./address-multistep/_useAddressStepState";
import { type ModalField } from "./constants";

interface AddressMultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: ModalField;
  city: string;
  setCity: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  khoroo: string;
  setKhoroo: (v: string) => void;
}

export const AddressMultiStepModal = ({
  isOpen,
  onClose,
  initialStep = "city",
  city,
  setCity,
  district,
  setDistrict,
  khoroo,
  setKhoroo,
}: AddressMultiStepModalProps) => {
  const noop = () => {};
  const { visible, animate } = useModalLifecycle(isOpen, noop, 200);
  const {
    search,
    setSearch,
    currentStep,
    isTransitioning,
    customValue,
    setCustomValue,
    filtered,
    transitionToStep,
    handleSelect,
    currentValue,
  } = useAddressStepState({
    isOpen,
    initialStep,
    city,
    district,
    khoroo,
    setCity,
    setDistrict,
    setKhoroo,
    onClose,
  });

  useScrollLock(visible);
  useEscapeKey(visible, onClose);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        <div className="flex items-center justify-between">
          <PrimaryHeading>Сонгох</PrimaryHeading>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <AddressStepBreadcrumbs
            currentStep={currentStep}
            city={city}
            district={district}
            onJumpTo={transitionToStep}
          />

          <div className="flex items-center gap-0.5 p-1.5 border border-border rounded-full">
            <div className="p-1.5">
              <Search />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Хайх"
              className="w-full bg-white text-sm font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
            />
          </div>

          <AddressOptionsList
            options={filtered}
            currentValue={currentValue}
            isTransitioning={isTransitioning}
            customValue={customValue}
            setCustomValue={setCustomValue}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};
