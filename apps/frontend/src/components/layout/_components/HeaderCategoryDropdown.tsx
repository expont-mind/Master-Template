"use client";

import { CategoryMenu } from "@/components/layout/CategoryMenu";

interface HeaderCategoryDropdownProps {
  isCategoryOpen: boolean;
  closeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsCategoryOpen: (open: boolean) => void;
}

export function HeaderCategoryDropdown({
  isCategoryOpen,
  closeTimeoutRef,
  setIsCategoryOpen,
}: HeaderCategoryDropdownProps) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- desktop-only hover-mega-menu wrapper; the trigger (Category button in Header) provides keyboard access
    <div
      className={`hidden md:block w-full bg-white shadow-sm overflow-hidden transition-[max-height,opacity] duration-300 ease-out absolute top-full left-0 right-0 ${isCategoryOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      onMouseEnter={() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setIsCategoryOpen(true);
      }}
      onMouseLeave={() => {
        closeTimeoutRef.current = setTimeout(() => setIsCategoryOpen(false), 200);
      }}
    >
      <div className="max-w-[1064px] mx-auto">
        <CategoryMenu />
      </div>
    </div>
  );
}
