"use client";

import { ChevronDownCategory } from "@/components/svg";

import type { CategoryWithChildren } from "@/lib/queries/products";

export function findCategoryPath(
  cats: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren[] | null {
  for (const cat of cats) {
    if (cat.slug === slug) return [cat];
    if (cat.children.length > 0) {
      const childPath = findCategoryPath(cat.children, slug);
      if (childPath) return [cat, ...childPath];
    }
  }
  return null;
}

interface CategoryItemProps {
  cat: CategoryWithChildren;
  depth: number;
  selectedSlug: string | null;
  expandedSlugs: Set<string>;
  onSelect: (cat: CategoryWithChildren) => void;
  onToggleExpand: (slug: string) => void;
}

function CategoryChildrenList({
  items,
  depth,
  selectedSlug,
  expandedSlugs,
  onSelect,
  onToggleExpand,
  isExpanded,
  paddingClass,
}: {
  items: CategoryWithChildren[];
  depth: number;
  selectedSlug: string | null;
  expandedSlugs: Set<string>;
  onSelect: (cat: CategoryWithChildren) => void;
  onToggleExpand: (slug: string) => void;
  isExpanded: boolean;
  paddingClass: string;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
      }}
    >
      <div className="overflow-hidden">
        <div className={`flex flex-col gap-1 mt-1 ${paddingClass}`}>
          {items.map((child) => (
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
  );
}

function CategoryItemRoot({
  cat,
  isSelected,
  isExpanded,
  hasChildren,
  onClick,
  childrenList,
}: {
  cat: CategoryWithChildren;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onClick: () => void;
  childrenList: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <button className="flex items-center gap-2 pr-1 h-8 cursor-pointer group" onClick={onClick}>
        <div className="flex items-center gap-1 w-full">
          <div className="w-7 h-7 rounded-sm overflow-hidden shrink-0">
            {cat.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            )}
          </div>
          <p
            className={`block max-w-[216px] text-start w-full truncate text-sm transition-all duration-100 group-hover:text-text-primary ${
              isSelected ? "text-text-primary font-bold" : "text-text-subtle font-normal"
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
      {childrenList}
    </div>
  );
}

function CategoryItemChild({
  cat,
  isSelected,
  isExpanded,
  hasChildren,
  onClick,
  childrenList,
}: {
  cat: CategoryWithChildren;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onClick: () => void;
  childrenList: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <button
        className={`flex items-center justify-between text-left h-8 text-sm hover:text-text-primary font-manrope transition-all duration-100 cursor-pointer ${
          isSelected ? "text-text-primary font-bold" : "text-text-subtle font-normal"
        }`}
        onClick={onClick}
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
      {childrenList}
    </div>
  );
}

export function CategoryItem({
  cat,
  depth,
  selectedSlug,
  expandedSlugs,
  onSelect,
  onToggleExpand,
}: CategoryItemProps) {
  const isExpanded = expandedSlugs.has(cat.slug);
  const isSelected = selectedSlug === cat.slug;
  const hasChildren = cat.children.length > 0;

  const handleClick = () => {
    onSelect(cat);
    if (hasChildren) {
      onToggleExpand(cat.slug);
    }
  };

  const childrenList = hasChildren ? (
    <CategoryChildrenList
      items={cat.children}
      depth={depth}
      selectedSlug={selectedSlug}
      expandedSlugs={expandedSlugs}
      onSelect={onSelect}
      onToggleExpand={onToggleExpand}
      isExpanded={isExpanded}
      paddingClass={depth === 0 ? "pl-8 pr-1" : "pl-4"}
    />
  ) : null;

  if (depth === 0) {
    return (
      <CategoryItemRoot
        cat={cat}
        isSelected={isSelected}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onClick={handleClick}
        childrenList={childrenList}
      />
    );
  }

  return (
    <CategoryItemChild
      cat={cat}
      isSelected={isSelected}
      isExpanded={isExpanded}
      hasChildren={hasChildren}
      onClick={handleClick}
      childrenList={childrenList}
    />
  );
}
