"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface BranchEditHeaderProps {
  isNew: boolean;
  name: string;
  isSaving: boolean;
  onSave: () => void;
}

export function BranchEditHeader({
  isNew,
  name,
  isSaving,
  onSave,
}: BranchEditHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {isNew ? "Шинэ салбар" : "Салбар засах"}
        </h2>
      </div>
      <Button onClick={onSave} disabled={isSaving || !name.trim()}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Хадгалж байна...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Хадгалах
          </>
        )}
      </Button>
    </div>
  );
}
