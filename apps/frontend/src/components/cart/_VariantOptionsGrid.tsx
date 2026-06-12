"use client";

// Sub-component of VariantEditSheet. Renders the collapsible option-group
// accordion (e.g. "Size" → "S/M/L"). Owns no state — parent supplies the
// expanded group, selected map, and the click handler.

import { Check } from "lucide-react";

import { ChevronDownBlack } from "@/components/svg";

import type { OptionGroup } from "@/lib/queries/products";

interface VariantOptionsGridProps {
  optionGroups: OptionGroup[];
  expandedGroupIndex: number;
  selectedOptions: Record<string, string>;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  onToggleGroup: (index: number) => void;
  onOptionSelect: (groupType: string, value: string) => void;
}

export function VariantOptionsGrid({
  optionGroups,
  expandedGroupIndex,
  selectedOptions,
  isOptionOutOfStock,
  onToggleGroup,
  onOptionSelect,
}: VariantOptionsGridProps) {
  return (
    <div className="flex flex-col gap-6">
      {optionGroups.map((group, groupIndex) => {
        const isExpanded = expandedGroupIndex === groupIndex;
        const selectedValue = selectedOptions[group.type];
        return (
          <OptionGroupAccordion
            key={group.type}
            group={group}
            isExpanded={isExpanded}
            selectedValue={selectedValue}
            selectedOptions={selectedOptions}
            isOptionOutOfStock={isOptionOutOfStock}
            onToggle={() => onToggleGroup(isExpanded ? -1 : groupIndex)}
            onOptionSelect={onOptionSelect}
          />
        );
      })}
    </div>
  );
}

interface OptionGroupAccordionProps {
  group: OptionGroup;
  isExpanded: boolean;
  selectedValue: string | undefined;
  selectedOptions: Record<string, string>;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  onToggle: () => void;
  onOptionSelect: (groupType: string, value: string) => void;
}

function OptionGroupAccordion({
  group,
  isExpanded,
  selectedValue,
  selectedOptions,
  isOptionOutOfStock,
  onToggle,
  onOptionSelect,
}: OptionGroupAccordionProps) {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full bg-surface flex items-center justify-between h-12 pl-3 pr-0.5 cursor-pointer"
      >
        <span
          className={`font-manrope text-base ${
            isExpanded || selectedValue
              ? "text-text-primary font-semibold"
              : "text-text-muted font-medium"
          }`}
        >
          {selectedValue ? `${selectedValue}` : `${group.type} сонгох`}
        </span>
        <div
          className="transition-transform duration-300 p-1.5"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDownBlack />
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col">
            {group.values.map((value) => {
              const isSelected = selectedOptions[group.type] === value;
              const outOfStock = isOptionOutOfStock(group.type, value);
              return (
                <OptionValueButton
                  key={value}
                  value={value}
                  isSelected={isSelected}
                  outOfStock={outOfStock}
                  onSelect={() => !outOfStock && onOptionSelect(group.type, value)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface OptionValueButtonProps {
  value: string;
  isSelected: boolean;
  outOfStock: boolean;
  onSelect: () => void;
}

function OptionValueButton({ value, isSelected, outOfStock, onSelect }: OptionValueButtonProps) {
  return (
    <button
      onClick={onSelect}
      disabled={outOfStock}
      className={`w-full flex items-center h-14 justify-between pl-3 pr-3 py-3 border-t border-border transition-[background-color,opacity] duration-300 ${
        outOfStock
          ? "opacity-40 cursor-not-allowed"
          : isSelected
            ? "bg-surface"
            : "cursor-pointer active:bg-surface"
      }`}
    >
      <span className="text-base font-manrope font-medium text-text-primary">{value}</span>
      {outOfStock ? (
        <span className="text-brand-primary text-xs font-medium font-manrope">Дууссан</span>
      ) : isSelected ? (
        <Check size={16} className="text-text-primary" />
      ) : null}
    </button>
  );
}
