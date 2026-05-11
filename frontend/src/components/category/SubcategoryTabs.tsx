"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryWithChildren } from "@/lib/queries/products";

interface SubcategoryTabsProps {
  parentCategory: CategoryWithChildren;
  selectedSlug: string | null;
}

export function SubcategoryTabs({
  parentCategory,
  selectedSlug,
}: SubcategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabClick = (slug: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  if (!parentCategory.children.length) {
    return null;
  }

  return (
    <div className="pb-0 md:pb-4">
      <div className="bg-[#F8FAFC] py-2 md:py-1.5 rounded-sm grid grid-cols-3 gap-0.5 md:gap-x-4 md:gap-y-[2px]">
        <button
          className={`px-4 py-2.5 text-left text-sm font-manrope cursor-pointer transition-all ${
            selectedSlug === parentCategory.slug
              ? "text-[#020617] font-medium"
              : "text-[#64748B] font-normal"
          }`}
          onClick={() => handleTabClick(parentCategory.slug)}
        >
          Бүгд
        </button>
        {parentCategory.children.map((sub) => (
          <button
            key={sub.id}
            className={`px-4 py-2.5 text-left text-sm font-manrope cursor-pointer hover:text-[#020617] whitespace-nowrap truncate transition-all ${
              selectedSlug === sub.slug
                ? "text-[#020617] font-medium"
                : "text-[#64748B] font-normal"
            }`}
            onClick={() => handleTabClick(sub.slug)}
          >
            {sub.name}
          </button>
        ))}
      </div>
    </div>
  );
}
