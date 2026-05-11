"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/utils/constants";
import { useCategories } from "@/lib/hooks/useCategories";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import type { CategoryWithChildren } from "@/lib/queries/products";
import { ChevronRightProduct } from "../svg";

interface MobileCategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCategoryMenu({
  isOpen,
  onClose,
}: MobileCategoryMenuProps) {
  const pathname = usePathname();
  const { data: categories = [], isLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  useScrollLock(isOpen);

  // Refs for scrolling
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Select first category by default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setSelectedCategoryId(categories[0]?.id || null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, categories]);

  // Close menu when pathname changes (navigation)
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

  // Handle category selection and scroll
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    // Scroll to the category in right column
    const categoryElement = categoryRefs.current.get(categoryId);
    if (categoryElement && rightColumnRef.current) {
      const containerTop = rightColumnRef.current.getBoundingClientRect().top;
      const elementTop = categoryElement.getBoundingClientRect().top;
      const scrollOffset =
        elementTop - containerTop + rightColumnRef.current.scrollTop;

      rightColumnRef.current.scrollTo({
        top: scrollOffset - 8, // Small offset for better visibility
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) return null;

  // Render a category group with header and children
  const renderCategoryGroup = (
    category: CategoryWithChildren,
    isLast: boolean,
  ) => {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div
        key={category.id}
        ref={(el) => {
          if (el) {
            categoryRefs.current.set(category.id, el);
          }
        }}
      >
        {/* Category header */}
        <Link
          href={ROUTES.CATEGORY(category.slug)}
          onClick={onClose}
          className="flex items-center justify-between px-4 py-0.5 bg-white"
        >
          <div className="flex items-center gap-1">
            {category.image ? (
              <div className="w-9 h-9 rounded overflow-hidden shrink-0">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-base">📦</span>
              </div>
            )}
            <span className="text-[#020617] font-medium text-base font-manrope line-clamp-1 w-full">
              {category.name}
            </span>
          </div>
          <ChevronRightProduct />
        </Link>

        {/* Children items */}
        {hasChildren && (
          <div className="flex flex-col">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={ROUTES.CATEGORY(child.slug)}
                onClick={onClose}
                className="px-6 py-2.5 text-[#020617] font-normal text-sm font-manrope whitespace-nowrap truncate"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* Divider between groups */}
        {!isLast && <div className="h-px bg-[#E2E8F0] mx-6 my-2" />}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 h-screen bottom-0 left-0 right-0 z-60 ${
        isAnimating ? "" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
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
          <div className="w-[148px] overflow-y-auto bg-[#F8FAFC] pl-3 py-3 pr-2 scrollbar-hide">
            {isLoading ? (
              <div className="flex flex-col gap-1.5 p-2.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-10 skeleton" />
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
                        ? "bg-white text-[#020617] font-medium"
                        : "text-[#64748B] hover:bg-white font-normal"
                    }`}
                  >
                    <span className="line-clamp-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column - All categories with their children */}
          <div
            ref={rightColumnRef}
            className="flex-1 overflow-y-auto bg-white scrollbar-hide"
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 skeleton" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col pt-2 pb-20">
                {categories.map((category, index) =>
                  renderCategoryGroup(
                    category,
                    index === categories.length - 1,
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
