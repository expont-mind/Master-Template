"use client";

import { useState } from "react";

import type { CategoryDialogMode } from "@/components/category/CategoryDialog";
import type { FlatCategory } from "@/components/category/tree/_tree-helpers";
import type { Category } from "@/components/category/types";

interface DialogState {
  open: boolean;
  mode: CategoryDialogMode;
  editTarget: Category | null;
  subParentId: string | null;
}

const INITIAL_DIALOG: DialogState = {
  open: false,
  mode: "new",
  editTarget: null,
  subParentId: null,
};

export function useCategoryDialogState(categories: Category[]) {
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsTarget, setProductsTarget] = useState<{ id: string; name: string } | null>(null);

  const closeDialog = () => setDialogState((s) => ({ ...s, open: false }));

  const openAddRoot = () =>
    setDialogState({ open: true, mode: "new", editTarget: null, subParentId: null });

  const openAddSub = (parentId: string) =>
    setDialogState({ open: true, mode: "sub", editTarget: null, subParentId: parentId });

  const openEdit = (cat: FlatCategory) => {
    const original = categories.find((c) => c.id === cat.id);
    if (original) {
      setDialogState({ open: true, mode: "edit", editTarget: original, subParentId: null });
    }
  };

  const openProducts = (cat: FlatCategory) => {
    setProductsTarget({ id: cat.id, name: cat.name });
    setProductsOpen(true);
  };

  const markForDelete = (c: FlatCategory) => {
    const original = categories.find((cat) => cat.id === c.id);
    if (original) setDeleteTarget(original);
  };

  const handleProductsOpenChange = (open: boolean) => {
    setProductsOpen(open);
    if (!open) setTimeout(() => setProductsTarget(null), 300);
  };

  return {
    dialogState,
    closeDialog,
    openAddRoot,
    openAddSub,
    openEdit,
    deleteTarget,
    setDeleteTarget,
    markForDelete,
    productsOpen,
    productsTarget,
    openProducts,
    handleProductsOpenChange,
  };
}
