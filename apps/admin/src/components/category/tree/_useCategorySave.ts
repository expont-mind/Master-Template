"use client";

import { useCallback } from "react";

import { deactivateCategorySubtree, invalidateCategoryCaches } from "@/components/category/actions";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";

import type { Category } from "@/components/category/types";

function generateUniqueSlug(name: string, existing: Category[]): string {
  let baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  if (!baseSlug) {
    baseSlug = `category-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  const existingSlugs = existing.map((c) => c.slug).filter(Boolean);
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

interface SaveDialogData {
  name: string;
  image: string;
  is_featured: boolean;
  is_active: boolean;
}

async function updateCategory(editTarget: Category, data: SaveDialogData): Promise<void> {
  const wasActive = editTarget.is_active !== false;
  const becomingInactive = wasActive && !data.is_active;

  if (becomingInactive) {
    await adminApi.update("categories", editTarget.id, {
      name: data.name,
      image: data.image || null,
      is_featured: data.is_featured,
    });
    await deactivateCategorySubtree(editTarget.id);
    return;
  }

  await adminApi.update("categories", editTarget.id, {
    name: data.name,
    image: data.image || null,
    is_featured: data.is_featured,
    is_active: data.is_active,
  });
  if (wasActive !== !!data.is_active) {
    await invalidateCategoryCaches();
  }
}

async function insertCategory(
  data: SaveDialogData,
  parentId: string | null,
  categories: Category[],
): Promise<void> {
  const siblings = categories.filter((c) => c.parent_id === parentId);
  const maxSortOrder = siblings.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1);
  const slug = generateUniqueSlug(data.name, categories);
  await adminApi.insert("categories", {
    name: data.name,
    slug,
    image: data.image || null,
    is_featured: data.is_featured,
    is_active: data.is_active,
    parent_id: parentId,
    sort_order: maxSortOrder + 1,
  });
}

interface UseCategorySaveArgs {
  categories: Category[];
  refresh: () => Promise<void>;
  setIsSaving: (saving: boolean) => void;
}

export function useCategorySaveHandlers({ categories, refresh, setIsSaving }: UseCategorySaveArgs) {
  const handleDialogSave = useCallback(
    async (
      data: SaveDialogData,
      mode: "new" | "sub" | "edit",
      editTarget: Category | null,
      subParentId: string | null,
    ) => {
      setIsSaving(true);
      try {
        if (mode === "edit" && editTarget) {
          await updateCategory(editTarget, data);
        } else {
          const parentId = mode === "sub" ? subParentId : null;
          await insertCategory(data, parentId, categories);
        }
        await refresh();
      } finally {
        setIsSaving(false);
      }
    },
    [categories, refresh, setIsSaving],
  );

  const handleDeleteConfirm = useCallback(
    async (deleteTarget: Category) => {
      setIsSaving(true);
      try {
        await deactivateCategorySubtree(deleteTarget.id);
        await refresh();
      } catch (error) {
        log.error("category_deactivate_failed", error);
      }
      setIsSaving(false);
    },
    [refresh, setIsSaving],
  );

  return { handleDialogSave, handleDeleteConfirm };
}
