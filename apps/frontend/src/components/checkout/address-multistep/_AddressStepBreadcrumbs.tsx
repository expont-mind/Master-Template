"use client";

import { CITY_OPTIONS, DISTRICT_OPTIONS, type ModalField } from "@/components/checkout/constants";
import { ChevronRight16 } from "@/components/svg";

interface AddressStepBreadcrumbsProps {
  currentStep: ModalField;
  city: string;
  district: string;
  onJumpTo: (step: ModalField) => void;
}

function getCityLabel(city: string) {
  return CITY_OPTIONS.find((o) => o.value === city)?.label || city;
}

function getDistrictLabel(district: string) {
  return DISTRICT_OPTIONS.find((o) => o.value === district)?.label || district;
}

export function AddressStepBreadcrumbs({
  currentStep,
  city,
  district,
  onJumpTo,
}: AddressStepBreadcrumbsProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-manrope overflow-x-auto scrollbar-hide">
      {currentStep === "city" && (
        <span className="text-text-primary font-semibold whitespace-nowrap">Хот / Аймаг</span>
      )}

      {(currentStep === "district" || currentStep === "khoroo") && (
        <>
          <button
            onClick={() => onJumpTo("city")}
            className="text-text-secondary text-base font-semibold hover:text-text-primary transition-colors whitespace-nowrap shrink-0"
          >
            {getCityLabel(city) || "Хот / Аймаг"}
          </button>
          <ChevronRight16 />

          {currentStep === "district" && (
            <span className="text-text-primary font-semibold whitespace-nowrap shrink-0">
              Дүүрэг / Сум
            </span>
          )}
        </>
      )}

      {currentStep === "khoroo" && (
        <>
          <button
            onClick={() => onJumpTo("district")}
            className="text-text-secondary text-base font-semibold hover:text-text-primary transition-colors whitespace-nowrap shrink-0"
          >
            {getDistrictLabel(district) || "Дүүрэг / Сум"}
          </button>
          <ChevronRight16 />
          <span className="text-text-primary font-semibold whitespace-nowrap shrink-0">
            Хороо / Баг
          </span>
        </>
      )}
    </div>
  );
}
