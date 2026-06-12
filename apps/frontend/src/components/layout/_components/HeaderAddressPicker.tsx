"use client";

import { ChevronDown, Location } from "@/components/svg";

interface DefaultAddress {
  district: string | null;
  sub_district: string | null;
  detail: string | null;
}

interface HeaderAddressPickerProps {
  defaultAddress: DefaultAddress | null | undefined;
  onClick: () => void;
}

export function HeaderAddressPicker({ defaultAddress, onClick }: HeaderAddressPickerProps) {
  return (
    <div className="hidden md:block shrink-0 pt-[6px] pb-2.5">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 py-2.5 px-1.5 cursor-pointer group bg-transparent border-0 text-left"
      >
        <div className="flex items-center gap-1.5">
          <Location />
          <p className="text-text-secondary font-medium text-[15px] font-manrope group-hover:text-text-primary transition-colors duration-200 truncate max-w-[146px]">
            {defaultAddress
              ? [defaultAddress.district, defaultAddress.sub_district, defaultAddress.detail]
                  .filter(Boolean)
                  .join(", ")
              : "Хүргүүлэх хаяг"}
          </p>
        </div>
        <div className={`w-4 h-4 flex items-center justify-center`}>
          <ChevronDown />
        </div>
      </button>
    </div>
  );
}
