"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "@/components/checkout/constants";

interface UseAddressStepStateArgs {
  isOpen: boolean;
  initialStep: ModalField;
  city: string;
  setCity: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  khoroo: string;
  setKhoroo: (v: string) => void;
  onClose: () => void;
}

function resolveStartStep(initial: ModalField, city: string, district: string): ModalField {
  if (initial === "district" && !city) return "city";
  if (initial === "khoroo" && (!city || !district)) {
    return !city ? "city" : "district";
  }
  return initial;
}

export function useAddressStepState({
  isOpen,
  initialStep,
  city,
  district,
  khoroo,
  setCity,
  setDistrict,
  setKhoroo,
  onClose,
}: UseAddressStepStateArgs) {
  const [search, setSearch] = useState("");
  const [currentStep, setCurrentStep] = useState<ModalField>("city");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch("");
    setCustomValue("");
    setCurrentStep(resolveStartStep(initialStep, city, district));
    // city/district reads are intentionally not deps — we only want this to
    // run when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialStep]);

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

  const transitionToStep = (newStep: ModalField) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(newStep);
      setSearch("");
      setCustomValue("");
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleSelect = (value: string) => {
    if (currentStep === "city") {
      setCity(value);
      if (city !== value) {
        setDistrict("");
        setKhoroo("");
      }
      transitionToStep("district");
      return;
    }
    if (currentStep === "district") {
      setDistrict(value);
      if (district !== value) setKhoroo("");
      transitionToStep("khoroo");
      return;
    }
    setKhoroo(value);
    onClose();
  };

  const currentValue =
    currentStep === "city" ? city : currentStep === "district" ? district : khoroo;

  return {
    search,
    setSearch,
    currentStep,
    isTransitioning,
    customValue,
    setCustomValue,
    currentOptions,
    filtered,
    transitionToStep,
    handleSelect,
    currentValue,
  };
}
