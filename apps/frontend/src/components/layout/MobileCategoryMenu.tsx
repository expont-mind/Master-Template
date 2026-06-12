"use client";

import { useCategories } from "@/lib/hooks/useCategories";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { CategoryAccordionItem } from "./_CategoryAccordionItem";
import { useMobileCategoryState } from "./_useMobileCategoryState";

const LEFT_SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"] as const;
const RIGHT_SKELETON_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"] as const;

interface MobileCategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCategoryMenu({ isOpen, onClose }: MobileCategoryMenuProps) {
  const { data: categories = [], isLoading } = useCategories();
  useScrollLock(isOpen);

  const {
    selectedCategoryId,
    isVisible,
    isAnimating,
    rightColumnRef,
    categoryRefs,
    handleCategoryClick,
  } = useMobileCategoryState({ isOpen, onClose, categories });

  if (!isVisible) return null;

  const registerCategoryRef = (id: string, el: HTMLDivElement | null) => {
    if (el) {
      categoryRefs.current.set(id, el);
    }
  };

  return (
    <div
      className={`fixed top-0 h-screen bottom-0 left-0 right-0 z-60 ${
        isAnimating ? "" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Цэс хаах"
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 border-0 p-0 cursor-default ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Menu panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-full bg-white flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Spacer for fixed header */}
        <div className="h-[94px] shrink-0" />

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left column - Main categories */}
          <div className="w-[148px] overflow-y-auto bg-surface pl-3 py-3 pr-2 scrollbar-hide">
            {isLoading ? (
              <div className="flex flex-col gap-1.5 p-2.5">
                {LEFT_SKELETON_KEYS.map((id) => (
                  <div key={id} className="h-10 skeleton" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-left p-2.5 rounded-lg font-manrope text-sm transition-colors cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? "bg-white text-text-primary font-medium"
                        : "text-text-secondary hover:bg-white font-normal"
                    }`}
                  >
                    <span className="line-clamp-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column - All categories with their children */}
          <div ref={rightColumnRef} className="flex-1 overflow-y-auto bg-white scrollbar-hide">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {RIGHT_SKELETON_KEYS.map((id) => (
                  <div key={id} className="h-12 skeleton" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col pt-2 pb-20">
                {categories.map((category, index) => (
                  <CategoryAccordionItem
                    key={category.id}
                    category={category}
                    isLast={index === categories.length - 1}
                    onClose={onClose}
                    registerRef={registerCategoryRef}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
