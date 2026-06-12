"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CategoryItem, findCategoryPath } from "./_CategoryItem";

import type { CategoryWithChildren } from "@/lib/queries/products";

const CATEGORY_SKELETON_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const;

interface CategorySidebarProps {
  categories: CategoryWithChildren[];
  isLoading: boolean;
}

export function CategorySidebar({ categories, isLoading }: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("category");

  const [hasMounted, setHasMounted] = useState(false);
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set(selectedSlug ? [selectedSlug] : []),
  );

  useEffect(() => {
    // SSR/CSR hydration boundary marker — one-shot mount flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  // Expand path to selected category on load
  useEffect(() => {
    if (selectedSlug && categories.length > 0) {
      const path = findCategoryPath(categories, selectedSlug);
      if (path) {
        // Expand ancestor path when the selected category changes via URL.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExpandedSlugs(new Set(path.map((c) => c.slug)));
      }
    }
  }, [categories, selectedSlug]);

  const toggleExpand = useCallback(
    (slug: string) => {
      setExpandedSlugs((prev) => {
        if (prev.has(slug)) {
          const path = findCategoryPath(categories, slug);
          if (path && path.length > 0) {
            const next = new Set<string>();
            for (const c of path) {
              if (c.slug === slug) break;
              next.add(c.slug);
            }
            return next;
          }
          const next = new Set(prev);
          next.delete(slug);
          return next;
        }
        const path = findCategoryPath(categories, slug);
        return new Set(path ? path.map((c) => c.slug) : [slug]);
      });
    },
    [categories],
  );

  const handleSelect = useCallback(
    (cat: CategoryWithChildren) => {
      const params = new URLSearchParams(searchParams.toString());
      // Only set category if slug exists
      if (cat.slug) {
        params.set("category", cat.slug);
      } else {
        params.delete("category");
      }
      // Reset to first page when changing category
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (isLoading || !hasMounted) {
    return (
      <div className="w-[280px] py-2.5 flex flex-col gap-2">
        <div className="space-y-3">
          {CATEGORY_SKELETON_IDS.map((id) => (
            <div key={id} className="h-8 skeleton rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] py-2.5 flex flex-col gap-2">
      {categories.map((cat) => (
        <CategoryItem
          key={cat.id}
          cat={cat}
          depth={0}
          selectedSlug={selectedSlug}
          expandedSlugs={expandedSlugs}
          onSelect={handleSelect}
          onToggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}
