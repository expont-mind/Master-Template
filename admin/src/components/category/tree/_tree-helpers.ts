// Tree-flattening helpers + visual config for the categories admin
// view. Keeping them out of the main component file lets the rendering
// code stay focused on UX while these stay independently inspectable.

import type { Category } from "../types";

export type Tab = "all" | "home" | "category_menu";

/** Background + text Tailwind classes per nesting level (1..5, capped). */
export const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-emerald-100 text-emerald-700",
  4: "bg-purple-100 text-purple-700",
  5: "bg-rose-100 text-rose-700",
};

export interface FlatCategory {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  image?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order: number;
  hasChildren: boolean;
  isLastChild: boolean;
  /** For each ancestor level, whether that ancestor is the last child among its siblings */
  ancestorIsLastFlags: boolean[];
}

export function flattenCategories(
  categories: Category[],
  parentId: string | null = null,
  level: number = 1,
  collapsedIds: Set<string> = new Set(),
  ancestorIsLastFlags: boolean[] = [],
): FlatCategory[] {
  const result: FlatCategory[] = [];
  const children = categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const hasChildren = categories.some((c) => c.parent_id === child.id);
    const isLastChild = i === children.length - 1;

    result.push({
      id: child.id,
      name: child.name,
      level,
      parentId: child.parent_id,
      image: child.image,
      is_featured: child.is_featured,
      is_active: child.is_active,
      sort_order: child.sort_order ?? 0,
      hasChildren,
      isLastChild,
      ancestorIsLastFlags: [...ancestorIsLastFlags],
    });

    if (!collapsedIds.has(child.id)) {
      result.push(
        ...flattenCategories(
          categories,
          child.id,
          level + 1,
          collapsedIds,
          [...ancestorIsLastFlags, isLastChild],
        ),
      );
    }
  }
  return result;
}
