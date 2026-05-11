"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { useCategories } from "@/lib/hooks/useCategories";

export function CategoryMenu() {
  const { data: categories = [], isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="pt-4 sm:pt-6 pb-4 max-h-[80vh] sm:max-h-[560px] overflow-y-auto">
        <div className="columns-1 sm:columns-2 md:columns-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 break-inside-avoid mb-4">
              <div className="h-6 w-3/4 skeleton" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-full skeleton" />
                <div className="h-4 w-5/6 skeleton" />
                <div className="h-4 w-4/5 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-6 pb-4 max-h-[80vh] sm:max-h-[560px] overflow-y-auto overscroll-contain">
      {/* Category Grid - single column on mobile, 2 on sm, 5 on md+ */}
      <div className="columns-1 sm:columns-2 md:columns-5 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="break-inside-avoid mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
            {/* Category Header - touch-friendly 44px min height on mobile */}
            <Link
              href={ROUTES.CATEGORY(cat.slug)}
              className="flex items-center gap-2 w-full min-h-[44px] sm:min-h-0 mb-1 sm:mb-2 cursor-pointer group"
            >
              {cat.image ? (
                <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-sm overflow-hidden shrink-0 bg-gray-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="text-lg sm:text-base shrink-0">🧴</span>
              )}
              <p className="text-[#020617] font-semibold text-[15px] sm:text-sm leading-snug font-manrope truncate">
                {cat.name}
              </p>
              {cat.children && cat.children.length > 0 && (
                <ChevronRight
                  size={16}
                  className="text-[#94A3B8] shrink-0 group-hover:text-[#64748B] transition-colors"
                  strokeWidth={1.5}
                />
              )}
            </Link>

            {/* Sub-items - better touch targets and readability on mobile */}
            <div className="max-h-none sm:max-h-[160px] overflow-hidden">
              <div className="flex flex-col">
                {cat.children?.slice(0, 8).map((child) => (
                  <Link
                    key={child.id}
                    href={ROUTES.CATEGORY(child.slug)}
                    className="text-left text-[#020617] font-normal text-[15px] sm:text-sm leading-relaxed sm:leading-normal font-manrope truncate min-h-[44px] sm:min-h-0 py-2.5 sm:py-[3px] flex items-center cursor-pointer hover:text-[#020617] hover:font-medium transition-all"
                  >
                    {child.name}
                  </Link>
                ))}
                {cat.children && cat.children.length > 8 && (
                  <Link
                    href={ROUTES.CATEGORY(cat.slug)}
                    className="text-left text-[#64748B] font-normal text-sm sm:text-xs leading-relaxed font-manrope truncate min-h-[44px] sm:min-h-0 py-2.5 sm:py-[3px] flex items-center cursor-pointer hover:underline"
                  >
                    Бүгдийг харах ({cat.children.length})
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
