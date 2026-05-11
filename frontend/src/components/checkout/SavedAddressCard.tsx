"use client";

import {
  ChevronDownBig,
  ChevronRightCheckout,
  LocationBig,
} from "@/components/svg";

interface SavedAddressCardProps {
  addressName: string;
  cityLabel: string;
  districtLabel: string;
  khorooLabel: string;
  detail: string;
  isDefault: boolean;
  onEdit: () => void;
}

export function SavedAddressCard({
  addressName,
  cityLabel,
  districtLabel,
  khorooLabel,
  detail,
  isDefault,
  onEdit,
}: SavedAddressCardProps) {
  return (
    <>
      {/* Desktop */}
      <button
        onClick={onEdit}
        className="hidden md:flex w-full items-center gap-6 p-4 border border-[#E2E8F0] rounded-sm cursor-pointer hover:border-[#CBD5E1] transition-colors duration-200 text-left"
      >
        <LocationBig />

        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-text-secondary font-medium text-base font-manrope line-clamp-1">
            {cityLabel} хот, {districtLabel} дүүрэг, {khorooLabel}
          </p>
          <p className="text-text-primary font-medium text-lg font-manrope leading-7 line-clamp-2">
            {detail}
          </p>
        </div>

        <div className="shrink-0">
          <ChevronRightCheckout />
        </div>
      </button>

      {/* Mobile */}
      <button
        onClick={onEdit}
        className="flex md:hidden w-full items-center pl-3 pr-6 py-4 border border-[#E2E8F0] rounded-[4px] cursor-pointer text-left"
      >
        <div className="flex-1 flex flex-col min-w-0">
          {(addressName || isDefault) && (
            <div className="flex items-center gap-1.5 mb-1">
              {addressName && (
                <span className="text-[#020617] font-medium text-base font-manrope">
                  {addressName}
                </span>
              )}
              {isDefault && (
                <span className="px-2 py-0.5 bg-[#F1F5F9] rounded-[6px] text-[#020617] font-bold text-xs font-manrope">
                  Үндсэн
                </span>
              )}
            </div>
          )}
          <p className="text-[#64748B] font-medium text-base font-manrope truncate">
            {cityLabel}, {districtLabel}, {khorooLabel}
          </p>
          {detail && (
            <p className="text-[#020617] font-medium text-base font-manrope truncate">
              {detail}
            </p>
          )}
        </div>

        <div className="shrink-0 ml-4 p-2">
          <ChevronDownBig />
        </div>
      </button>
    </>
  );
}
