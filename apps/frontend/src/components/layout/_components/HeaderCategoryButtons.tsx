"use client";

import { Menu } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

interface HeaderCategoryButtonsProps {
  pathname: string;
  closeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsCategoryOpen: (open: boolean) => void;
  setIsMobileCategoryOpen: (fn: (prev: boolean) => boolean) => void;
  onDesktopClick: () => void;
}

export function HeaderCategoryButtons({
  pathname,
  closeTimeoutRef,
  setIsCategoryOpen,
  setIsMobileCategoryOpen,
  onDesktopClick,
}: HeaderCategoryButtonsProps) {
  const isActive = pathname.startsWith(ROUTES.PRODUCTS);
  return (
    <>
      {/* Mobile: Toggle mobile category menu */}
      <button
        onClick={() => setIsMobileCategoryOpen((prev) => !prev)}
        className={`md:hidden flex items-center gap-[10px] px-3 py-3 cursor-pointer border-b-2 transition-colors ${
          isActive ? "border-text-primary" : "border-transparent"
        }`}
      >
        <Menu color={isActive ? "#020617" : "#64748B"} />
        <p
          className={`font-medium hover:text-text-primary duration-200 text-[15px] font-manrope transition-colors ${
            isActive ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          Категори
        </p>
      </button>

      {/* Desktop: Hover dropdown */}
      <button
        onClick={onDesktopClick}
        onMouseEnter={() => {
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          setIsCategoryOpen(true);
        }}
        onMouseLeave={() => {
          closeTimeoutRef.current = setTimeout(() => setIsCategoryOpen(false), 200);
        }}
        className={`hidden md:flex items-center gap-[10px] px-0 pt-[14px] pb-[20px] cursor-pointer border-b-2 transition-colors ${
          isActive ? "border-text-primary" : "border-transparent"
        }`}
      >
        <Menu color={isActive ? "#020617" : "#64748B"} />
        <p
          className={`font-medium hover:text-text-primary duration-200 text-[15px] font-manrope transition-colors ${
            isActive ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          Категори
        </p>
      </button>
    </>
  );
}
