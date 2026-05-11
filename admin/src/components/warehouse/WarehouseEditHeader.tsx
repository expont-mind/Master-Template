"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface WarehouseEditHeaderProps {
  isNew: boolean;
  name: string;
  isSaving: boolean;
  onSave: () => void;
}

export function WarehouseEditHeader({
  isNew,
  name,
  isSaving,
  onSave,
}: WarehouseEditHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "Шинэ агуулах" : name || "Агуулах засах"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? "Шинэ агуулах үүсгэх"
              : "Агуулахын мэдээллийг засах"}
          </p>
        </div>
      </div>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Хадгалах
      </Button>
    </div>
  );
}
