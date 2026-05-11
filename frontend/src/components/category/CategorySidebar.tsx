"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownCategory } from "@/components/svg";
import type { CategoryWithChildren } from "@/lib/queries/products";

function findPath(
  cats: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren[] | null {
  for (const cat of cats) {
    if (cat.slug === slug) return [cat];
    if (cat.children.length > 0) {
      const childPath = findPath(cat.children, slug);
      if (childPath) return [cat, ...childPath];
    }
  }
  return null;
}

function CategoryItem({
  cat,
  depth,
  selectedSlug,
  expandedSlugs,
  onSelect,
  onToggleExpand,
}: {
  cat: CategoryWithChildren;
  depth: number;
  selectedSlug: string | null;
  expandedSlugs: Set<string>;
  onSelect: (cat: CategoryWithChildren) => void;
  onToggleExpand: (slug: string) => void;
}) {
  const isExpanded = expandedSlugs.has(cat.slug);
  const isSelected = selectedSlug === cat.slug;
  const hasChildren = cat.children.length > 0;

  const handleClick = () => {
    onSelect(cat);
    if (hasChildren) {
      onToggleExpand(cat.slug);
    }
  };

  if (depth === 0) {
    return (
      <div className="flex flex-col">
        <button
          className="flex items-center gap-2 pr-1 h-8 cursor-pointer group"
          onClick={handleClick}
        >
          <div className="flex items-center gap-1 w-full">
            <div className="w-7 h-7 rounded-sm overflow-hidden shrink-0">
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p
              className={`block max-w-[216px] text-start w-full truncate text-sm transition-all duration-100 group-hover:text-[#020617] ${
                isSelected
                  ? "text-[#020617] font-bold"
                  : "text-[#475569] font-normal"
              }`}
            >
              {cat.name}
            </p>
          </div>
          {hasChildren && (
            <div
              className="transition-transform duration-200 ease-in-out"
              style={{
                transform: isExpanded ? "rotate(-180deg)" : "rotate(0deg)",
              }}
            >
              <ChevronDownCategory />
            </div>
          )}
        </button>

        {hasChildren && (
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-in-out"
            style={{
              gridTemplateRows: isExpanded ? "1fr" : "0fr",
            }}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-1 pl-8 pr-1 mt-1">
                {cat.children.map((child) => (
                  <CategoryItem
                    key={child.id}
                    cat={child}
                    depth={depth + 1}
                    selectedSlug={selectedSlug}
                    expandedSlugs={expandedSlugs}
                    onSelect={onSelect}
                    onToggleExpand={onToggleExpand}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        className={`flex items-center justify-between text-left h-8 text-sm hover:text-[#020617] font-manrope transition-all duration-100 cursor-pointer ${
          isSelected ? "text-[#020617] font-bold" : "text-[#475569] font-normal"
        }`}
        onClick={handleClick}
      >
        <span className="truncate">{cat.name}</span>
        {hasChildren && (
          <div
            className="shrink-0 transition-transform duration-200 ease-in-out"
            style={{
              transform: isExpanded ? "rotate(-180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDownCategory />
          </div>
        )}
      </button>

      {hasChildren && (
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
          }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1 pl-4 mt-1">
              {cat.children.map((child) => (
                <CategoryItem
                  key={child.id}
                  cat={child}
                  depth={depth + 1}
                  selectedSlug={selectedSlug}
                  expandedSlugs={expandedSlugs}
                  onSelect={onSelect}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CategorySidebarProps {
  categories: CategoryWithChildren[];
  isLoading: boolean;
}

export function CategorySidebar({
  categories,
  isLoading,
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("category");

  const [hasMounted, setHasMounted] = useState(false);
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set(selectedSlug ? [selectedSlug] : []),
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Expand path to selected category on load
  useEffect(() => {
    if (selectedSlug && categories.length > 0) {
      const path = findPath(categories, selectedSlug);
      if (path) {
        setExpandedSlugs(new Set(path.map((c) => c.slug)));
      }
    }
  }, [categories, selectedSlug]);

  const toggleExpand = useCallback(
    (slug: string) => {
      setExpandedSlugs((prev) => {
        if (prev.has(slug)) {
          const path = findPath(categories, slug);
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
        } else {
          const path = findPath(categories, slug);
          return new Set(path ? path.map((c) => c.slug) : [slug]);
        }
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 skeleton rounded-sm"
            />
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
