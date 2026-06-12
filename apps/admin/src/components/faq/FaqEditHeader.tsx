"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface FaqEditHeaderProps {
  isNew: boolean;
  id: string;
  isSaving: boolean;
  onSave: () => void;
}

export function FaqEditHeader({ isNew, id: _id, isSaving, onSave }: FaqEditHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {isNew ? "Шинэ асуулт" : "Асуулт засах"}
        </h2>
      </div>
      <Button onClick={onSave} disabled={isSaving}>
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
