"use client";

import { CITY_OPTIONS, DISTRICT_OPTIONS, KHOROO_OPTIONS } from "@/components/checkout/constants";

import type { AddressWithId } from "@/lib/hooks/useCheckout";

function getCityLabel(value: string) {
  return CITY_OPTIONS.find((o) => o.value === value)?.label || value;
}

function getDistrictLabel(value: string) {
  return DISTRICT_OPTIONS.find((o) => o.value === value)?.label || value;
}

function getKhorooLabel(value: string) {
  return KHOROO_OPTIONS.find((o) => o.value === value)?.label || value;
}

interface AddressSelectItemProps {
  addr: AddressWithId;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function AddressSelectItem({ addr, isSelected, onSelect, onEdit }: AddressSelectItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`w-full flex items-center gap-4 py-4 pl-4 pr-2 border rounded-sm transition-colors duration-200 cursor-pointer ${isSelected ? "border-text-primary" : "border-border"} md:border-border md:hover:border-border-strong`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="p-1 border border-border rounded-full shadow-[0_1px_2px_0_rgba(0,0,0,0.10)]">
        <div
          className={`w-2 h-2 rounded-full ${isSelected ? "bg-text-primary" : "bg-white"}`}
        ></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <p className="text-text-secondary font-medium text-base font-manrope truncate md:hidden">
          {addr.city}, {addr.district}, {addr.sub_district}
        </p>
        <p className="text-text-secondary font-medium text-base font-manrope truncate hidden md:block">
          {getCityLabel(addr.city)} хот, {getDistrictLabel(addr.district)} дүүрэг,{" "}
          {getKhorooLabel(addr.sub_district)}
        </p>

        <p className="text-text-primary text-start font-medium text-base md:text-lg font-manrope md:leading-7 truncate md:line-clamp-2">
          {addr.detail}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="shrink-0 p-1 text-text-secondary font-normal text-sm font-manrope cursor-pointer hover:text-text-primary transition-colors duration-200"
      >
        <span className="px-0.5">Засах</span>
      </button>
    </div>
  );
}
