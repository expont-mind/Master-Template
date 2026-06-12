"use client";

import { Boxes, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CategoryDialogs } from "./tree/_CategoryDialogs";
import { CategoryToolbar } from "./tree/_CategoryToolbar";
import { CategoryTreeTable } from "./tree/_CategoryTreeTable";
import { useCategoryData } from "./tree/_useCategoryData";
import { useCategoryDialogState } from "./tree/_useCategoryDialogState";
import { useCategoryDnd } from "./tree/_useCategoryDnd";
import { useCategoryFilters } from "./tree/_useCategoryFilters";
import { useCategorySaveHandlers } from "./tree/_useCategorySave";

function CategoryEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Ангилал байхгүй</h3>
      <p className="text-sm text-muted-foreground mb-4">Эхний ангилалаа нэмнэ үү</p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Шинэ ангилал
      </Button>
    </div>
  );
}

export function Categories() {
  const { categories, setCategories, isLoading, fetchCategories } = useCategoryData();
  const filters = useCategoryFilters(categories);
  const dialog = useCategoryDialogState(categories);
  const [, setIsSaving] = useState(false);
  const dnd = useCategoryDnd({
    displayList: filters.displayList,
    setCategories,
    refresh: fetchCategories,
  });

  const { handleDialogSave, handleDeleteConfirm } = useCategorySaveHandlers({
    categories,
    refresh: fetchCategories,
    setIsSaving,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <CategoryToolbar
        activeTab={filters.activeTab}
        onChangeTab={filters.setActiveTab}
        search={filters.search}
        onChangeSearch={filters.setSearch}
        onExpandAll={filters.expandAll}
        onCollapseAll={filters.collapseAll}
        onAddRoot={dialog.openAddRoot}
      />

      {categories.length === 0 ? (
        <CategoryEmptyState onAdd={dialog.openAddRoot} />
      ) : (
        <CategoryTreeTable
          displayList={filters.displayList}
          collapsedIds={filters.collapsedIds}
          activeDragId={dnd.activeDragId}
          onToggleCollapse={filters.toggleCollapse}
          onAddSub={dialog.openAddSub}
          onEdit={dialog.openEdit}
          onProducts={dialog.openProducts}
          onDelete={dialog.markForDelete}
          onDragStart={dnd.handleDragStart}
          onDragEnd={dnd.handleDragEnd}
        />
      )}

      <CategoryDialogs
        dialog={dialog}
        onSave={(data) =>
          handleDialogSave(
            data,
            dialog.dialogState.mode,
            dialog.dialogState.editTarget,
            dialog.dialogState.subParentId,
          )
        }
        onDelete={handleDeleteConfirm}
      />
    </div>
  );
}
