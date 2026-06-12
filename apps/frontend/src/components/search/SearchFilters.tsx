"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import type { ProductFilters } from "@/lib/queries/search";

interface SearchFiltersProps {
  filters: ProductFilters;
}

interface CategoryOption {
  name: string;
  slug: string;
}

export function SearchFilters({ filters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) {
          const validCategories = data.filter((cat) => cat.slug && cat.slug.trim() !== "");
          setCategories(validCategories);
        }
      });
  }, []);

  const updateCategory = (categorySlug: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6 py-2.5">
      {/* Category filter */}
      <div>
        <p className="text-sm font-semibold text-text-primary font-manrope mb-3">Категори</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => updateCategory(undefined)}
            className={`text-left text-sm font-manrope px-3 py-2 rounded-sm cursor-pointer transition-colors ${
              !filters.category
                ? "bg-text-primary text-white"
                : "text-text-secondary hover:bg-border-light"
            }`}
          >
            Бүгд
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateCategory(cat.slug)}
              className={`text-left text-sm font-manrope px-3 py-2 rounded-sm cursor-pointer transition-colors ${
                filters.category === cat.slug
                  ? "bg-text-primary text-white"
                  : "text-text-secondary hover:bg-border-light"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
