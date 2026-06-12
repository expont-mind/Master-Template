"use client";

import { useMemo, useState } from "react";

import { flattenCategories, type FlatCategory, type Tab } from "./_tree-helpers";

import type { Category } from "@/components/category/types";

function getAncestorIds(categories: Category[], targetIds: Set<string>): Set<string> {
  const ancestorIds = new Set<string>();
  for (const id of targetIds) {
    let current = categories.find((c) => c.id === id);
    while (current?.parent_id) {
      ancestorIds.add(current.parent_id);
      current = categories.find((c) => c.id === current!.parent_id);
    }
  }
  return ancestorIds;
}

function applyTabFilter(list: FlatCategory[], tab: Tab): FlatCategory[] {
  if (tab === "home") return list.filter((c) => c.is_featured);
  if (tab === "category_menu") return list.filter((c) => !c.is_featured);
  return list;
}

function applySearchFilter(
  list: FlatCategory[],
  search: string,
  categories: Category[],
): FlatCategory[] {
  const query = search.trim().toLowerCase();
  if (!query) return list;
  const matchIds = new Set(
    list.filter((c) => c.name.toLowerCase().includes(query)).map((c) => c.id),
  );
  const ancestorIds = getAncestorIds(categories, matchIds);
  return list.filter((c) => matchIds.has(c.id) || ancestorIds.has(c.id));
}

export function useCategoryFilters(categories: Category[]) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const flatList = useMemo(
    () => flattenCategories(categories, null, 1, collapsedIds),
    [categories, collapsedIds],
  );

  const displayList = useMemo(
    () => applySearchFilter(applyTabFilter(flatList, activeTab), search, categories),
    [flatList, activeTab, search, categories],
  );

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());

  const collapseAll = () => {
    const parentIds = new Set(
      categories.filter((c) => categories.some((ch) => ch.parent_id === c.id)).map((c) => c.id),
    );
    setCollapsedIds(parentIds);
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    collapsedIds,
    flatList,
    displayList,
    toggleCollapse,
    expandAll,
    collapseAll,
  };
}
