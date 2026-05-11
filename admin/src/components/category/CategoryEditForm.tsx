"use client";

import { Loader2 } from "lucide-react";
import { CategoryEditHeader } from "./CategoryEditHeader";
import { CategoryEditCard } from "./CategoryEditCard";
import { useCategoryEdit } from "@/hooks/useCategoryEdit";

interface CategoryEditFormProps {
  id: string;
}

export function CategoryEditForm({ id }: CategoryEditFormProps) {
  const {
    isLoading,
    error,
    currentCategory,
    name,
    image,
    parentId,
    availableParents,
    setName,
    setImage,
    setParentId,
    handleSubmit,
  } = useCategoryEdit(id);

  if (!currentCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryEditHeader />
      <CategoryEditCard
        name={name}
        parentId={parentId}
        image={image}
        availableParents={availableParents}
        isLoading={isLoading}
        error={error}
        onNameChange={setName}
        onParentChange={setParentId}
        onImageChange={setImage}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
