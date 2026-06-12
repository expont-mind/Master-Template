"use client";

import { MoreVerticalBig } from "@/components/svg";

import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressListItemProps {
  address: AddressRow;
  isSelected: boolean;
  isDropdownOpen: boolean;
  onSelect: () => void;
  onToggleDropdown: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
}

export const AddressListItem = ({
  address,
  isSelected,
  isDropdownOpen,
  onSelect,
  onToggleDropdown,
  onEdit,
  onRequestDelete,
}: AddressListItemProps) => {
  const general = [address.city, address.district, address.sub_district].filter(Boolean).join(", ");

  return (
    <div
      className="bg-white border border-border rounded-[4px] flex items-center gap-3 md:gap-4 pl-3 md:pl-4 pr-3 md:pr-6 py-3 md:py-4 cursor-pointer"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="p-1 border border-border rounded-full shadow-[0_1px_2px_0_rgba(0,0,0,0.10)]">
        <div
          className={`w-2 h-2 rounded-full transition-all duration-200 ease-in-out ${
            isSelected ? "bg-text-primary scale-100" : "bg-white scale-0"
          }`}
        ></div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          {address.name && (
            <span className="text-text-primary font-semibold text-sm font-manrope">
              {address.name}
            </span>
          )}
          {address.is_default && (
            <span className="bg-border-light text-text-primary font-bold text-xs font-manrope leading-4 px-2 pt-0.5 pb-1 rounded-sm">
              Үндсэн
            </span>
          )}
        </div>
        {general && (
          <p className="text-text-secondary font-medium text-base font-manrope leading-6 truncate">
            {general}
          </p>
        )}
        {address.detail && (
          <p className="text-text-primary font-medium text-lg font-manrope leading-7">
            {address.detail}
          </p>
        )}
      </div>

      {/* More Button & Dropdown */}
      <div className="relative" data-dropdown>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDropdown();
          }}
          className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-surface rounded transition-colors"
        >
          <MoreVerticalBig />
        </button>

        <div
          className={`absolute right-0 top-full bg-white border p-1 border-border rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.10)] z-10 w-[128px] transition-all duration-200 origin-top-right ${
            isDropdownOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-full text-left rounded-md px-2 py-1.5 text-text-primary font-normal text-sm font-manrope hover:bg-surface transition-colors cursor-pointer"
          >
            Засах
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete();
            }}
            className="w-full text-left rounded-md px-2 py-1.5 text-text-primary font-normal text-sm font-manrope hover:bg-surface transition-colors cursor-pointer"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
};
