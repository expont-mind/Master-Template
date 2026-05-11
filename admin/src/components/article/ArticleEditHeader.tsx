"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save, Globe } from "lucide-react";
import type { ContentStatus } from "@/types/database";

interface ArticleEditHeaderProps {
  isNew: boolean;
  articleId?: string;
  status: ContentStatus;
  title: string;
  isSaving: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export function ArticleEditHeader({
  isNew,
  articleId,
  status,
  title,
  isSaving,
  onSave,
  onPublish,
}: ArticleEditHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {isNew ? "Шинэ нийтлэл" : "Нийтлэл засах"}
        </h2>
      </div>
      <div className="flex gap-2">
        {status !== "published" && (
          <Button
            variant="outline"
            onClick={onPublish}
            disabled={isSaving || !title.trim()}
          >
            <Globe className="mr-2 h-4 w-4" />
            Нийтлэх
          </Button>
        )}
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
    </div>
  );
}
