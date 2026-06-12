"use client";

import { Loader2 } from "lucide-react";

import { useBrandEdit } from "@/hooks/useBrandEdit";

import { BrandEditCard } from "./BrandEditCard";
import { BrandEditHeader } from "./BrandEditHeader";

interface BrandEditFormProps {
  id: string;
}

export function BrandEditForm({ id }: BrandEditFormProps) {
  const { isLoading, error, currentBrand, name, logoUrl, setName, setLogoUrl, handleSubmit } =
    useBrandEdit(id);

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BrandEditHeader />
      <BrandEditCard
        name={name}
        logoUrl={logoUrl}
        isLoading={isLoading}
        error={error}
        onNameChange={setName}
        onLogoChange={setLogoUrl}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
