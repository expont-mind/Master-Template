"use client";

import { CategoryDialog } from "@/components/category/CategoryDialog";
import { CategoryProductsDialog } from "@/components/category/CategoryProductsDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import type { useCategoryDialogState } from "./_useCategoryDialogState";
import type { Category } from "@/components/category/types";

type DialogStateHandle = ReturnType<typeof useCategoryDialogState>;

type SaveData = { name: string; image: string; is_featured: boolean; is_active: boolean };

interface EditDialogProps {
  dialog: DialogStateHandle;
  onSave: (data: SaveData) => Promise<void>;
}

function EditDialog({ dialog, onSave }: EditDialogProps) {
  const target = dialog.dialogState.editTarget;
  return (
    <CategoryDialog
      open={dialog.dialogState.open}
      onOpenChange={(open) => {
        if (!open) dialog.closeDialog();
      }}
      mode={dialog.dialogState.mode}
      initialName={target?.name ?? ""}
      initialImage={target?.image ?? ""}
      initialFeatured={target?.is_featured ?? false}
      initialStatus={target?.is_active !== false}
      onSave={onSave}
    />
  );
}

interface DeleteDialogProps {
  dialog: DialogStateHandle;
  onDelete: (target: Category) => Promise<void> | void;
}

function DeleteDialog({ dialog, onDelete }: DeleteDialogProps) {
  const { deleteTarget } = dialog;
  return (
    <ConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => {
        if (!open) dialog.setDeleteTarget(null);
      }}
      title="Ангилал нуух"
      description={`"${deleteTarget?.name ?? ""}" ангилал болон түүний дэд ангилалуудыг идэвхгүй болгож нуух уу? Бүтээгдэхүүнүүд хэвээр харагдана.`}
      confirmText="Нуух"
      cancelText="Болих"
      variant="destructive"
      onConfirm={() => {
        if (deleteTarget) {
          onDelete(deleteTarget);
          dialog.setDeleteTarget(null);
        }
      }}
    />
  );
}

function ProductsDialog({ dialog }: { dialog: DialogStateHandle }) {
  return (
    <CategoryProductsDialog
      open={dialog.productsOpen}
      onOpenChange={dialog.handleProductsOpenChange}
      categoryId={dialog.productsTarget?.id ?? ""}
      categoryName={dialog.productsTarget?.name ?? ""}
    />
  );
}

interface CategoryDialogsProps {
  dialog: DialogStateHandle;
  onSave: (data: SaveData) => Promise<void>;
  onDelete: (target: Category) => Promise<void> | void;
}

export function CategoryDialogs({ dialog, onSave, onDelete }: CategoryDialogsProps) {
  return (
    <>
      <EditDialog dialog={dialog} onSave={onSave} />
      <DeleteDialog dialog={dialog} onDelete={onDelete} />
      <ProductsDialog dialog={dialog} />
    </>
  );
}
