"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel, ChevronRight16, Search } from "../svg";
import { Check } from "lucide-react";
import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "./constants";
import { PrimaryHeading } from "@/components/ui/typography";

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
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [search, setSearch] = useState("");
  const [currentStep, setCurrentStep] = useState<ModalField>("city");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customValue, setCustomValue] = useState("");

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setSearch("");
      setCustomValue("");

      // Determine valid initial step (only when modal opens)
      let startStep = initialStep || "city";
      if (startStep === "district" && !city) startStep = "city";
      if (startStep === "khoroo" && (!city || !district)) {
        if (!city) startStep = "city";
        else startStep = "district";
      }

      setCurrentStep(startStep);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialStep]);

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

  const currentOptions = useMemo(() => {
    if (currentStep === "city") return CITY_OPTIONS;
    if (currentStep === "district") return DISTRICT_OPTIONS;
    return KHOROO_OPTIONS;
  }, [currentStep]);

  const filtered = useMemo(() => {
    if (!search.trim()) return currentOptions;
    const q = search.toLowerCase();
    return currentOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [search, currentOptions]);

  // Helper function to smoothly transition between steps
  const transitionToStep = (newStep: "city" | "district" | "khoroo") => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(newStep);
      setSearch("");
      setCustomValue("");
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleSelect = (value: string) => {
    if (currentStep === "city") {
      setCity(value);
      // If city changed, reset subsequent fields
      if (city !== value) {
        setDistrict("");
        setKhoroo("");
      }
      transitionToStep("district");
    } else if (currentStep === "district") {
      setDistrict(value);
      if (district !== value) {
        setKhoroo("");
      }
      transitionToStep("khoroo");
    } else {
      setKhoroo(value);
      onClose();
    }
  };

  const getCityLabel = () =>
    CITY_OPTIONS.find((o) => o.value === city)?.label || city;
  const getDistrictLabel = () =>
    DISTRICT_OPTIONS.find((o) => o.value === district)?.label || district;

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

        {/* Breadcrumbs & Search */}
        <div className="flex flex-col gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm font-manrope overflow-x-auto scrollbar-hide">
            {currentStep === "city" && (
              <span className="text-[#020617] font-semibold whitespace-nowrap">
                Хот / Аймаг
              </span>
            )}

            {(currentStep === "district" || currentStep === "khoroo") && (
              <>
                <button
                  onClick={() => transitionToStep("city")}
                  className="text-[#64748B] text-base font-semibold hover:text-[#020617] transition-colors whitespace-nowrap shrink-0"
                >
                  {getCityLabel() || "Хот / Аймаг"}
                </button>
                <ChevronRight16 />

                {currentStep === "district" && (
                  <span className="text-[#020617] font-semibold whitespace-nowrap shrink-0">
                    Дүүрэг / Сум
                  </span>
                )}
              </>
            )}

            {currentStep === "khoroo" && (
              <>
                <button
                  onClick={() => transitionToStep("district")}
                  className="text-[#64748B] text-base font-semibold hover:text-[#020617] transition-colors whitespace-nowrap shrink-0"
                >
                  {getDistrictLabel() || "Дүүрэг / Сум"}
                </button>
                <ChevronRight16 />
                <span className="text-[#020617] font-semibold whitespace-nowrap shrink-0">
                  Хороо / Баг
                </span>
              </>
            )}
          </div>

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

          <div
            className={`flex flex-col max-h-[392px] overflow-y-auto transition-opacity duration-200 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Custom address input with inline "Нэмэх" button - always at top */}
            <div className="relative mb-1">
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customValue.trim()) {
                    handleSelect(customValue.trim());
                    setCustomValue("");
                  }
                }}
                placeholder="Бичих"
                className="w-full py-2 px-2 pr-[72px] rounded-md font-manrope text-base font-medium text-[#020617] placeholder:text-[#94A3B8] border border-dashed border-[#CBD5E1] focus:outline-none focus:border-[#020617] transition-all duration-150"
              />
              <button
                onClick={() => {
                  if (customValue.trim()) {
                    handleSelect(customValue.trim());
                    setCustomValue("");
                  }
                }}
                disabled={!customValue.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1 px-3 rounded font-manrope text-sm font-semibold cursor-pointer transition-all duration-150 bg-[#020617] text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Нэмэх
              </button>
            </div>

            {filtered.map((option) => {
              const currentValue =
                currentStep === "city"
                  ? city
                  : currentStep === "district"
                    ? district
                    : khoroo;
              const isSelected = option.value === currentValue;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between py-2 px-2 rounded-md font-manrope text-base cursor-pointer transition-all duration-150 font-medium ${
                    isSelected
                      ? "text-[#020617] bg-[#F8FAFC]"
                      : "text-[#64748B] hover:text-[#020617] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="text-left">{option.label}</span>
                  {isSelected && (
                    <Check size={16} className="text-[#020617] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-4 text-[#94A3B8] text-sm font-manrope text-center">
                Илэрц олдсонгүй
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
