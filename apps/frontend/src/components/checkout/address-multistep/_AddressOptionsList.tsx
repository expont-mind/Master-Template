"use client";

import { Check } from "lucide-react";

import type { SelectOption } from "@/components/checkout/SelectModal";

interface AddressOptionsListProps {
  options: SelectOption[];
  currentValue: string;
  isTransitioning: boolean;
  customValue: string;
  setCustomValue: (v: string) => void;
  onSelect: (value: string) => void;
}

function CustomValueInput({
  customValue,
  setCustomValue,
  onSelect,
}: {
  customValue: string;
  setCustomValue: (v: string) => void;
  onSelect: (value: string) => void;
}) {
  const submitCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setCustomValue("");
  };

  return (
    <div className="relative mb-1">
      <input
        type="text"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitCustom();
        }}
        placeholder="Бичих"
        className="w-full py-2 px-2 pr-[72px] rounded-md font-manrope text-base font-medium text-text-primary placeholder:text-text-muted border border-dashed border-border-strong focus:outline-none focus:border-text-primary transition-all duration-150"
      />
      <button
        onClick={submitCustom}
        disabled={!customValue.trim()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1 px-3 rounded font-manrope text-sm font-semibold cursor-pointer transition-all duration-150 bg-text-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Нэмэх
      </button>
    </div>
  );
}

export function AddressOptionsList({
  options,
  currentValue,
  isTransitioning,
  customValue,
  setCustomValue,
  onSelect,
}: AddressOptionsListProps) {
  return (
    <div
      className={`flex flex-col max-h-[392px] overflow-y-auto transition-opacity duration-200 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      <CustomValueInput
        customValue={customValue}
        setCustomValue={setCustomValue}
        onSelect={onSelect}
      />

      {options.map((option) => {
        const isSelected = option.value === currentValue;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`flex items-center justify-between py-2 px-2 rounded-md font-manrope text-base cursor-pointer transition-all duration-150 font-medium ${
              isSelected
                ? "text-text-primary bg-surface"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
          >
            <span className="text-left">{option.label}</span>
            {isSelected && <Check size={16} className="text-text-primary shrink-0 ml-2" />}
          </button>
        );
      })}

      {options.length === 0 && (
        <p className="py-4 text-text-muted text-sm font-manrope text-center">Илэрц олдсонгүй</p>
      )}
    </div>
  );
}
