"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useArticleEdit } from "@/hooks/useArticleEdit";

import { ArticleContentCard } from "./ArticleContentCard";
import { ArticleEditHeader } from "./ArticleEditHeader";
import { ArticleImageUploadCard } from "./ArticleImageUploadCard";
import { ArticleInfoCard } from "./ArticleInfoCard";
import { ArticlePreviewCard } from "./ArticlePreviewCard";
import { ArticleSettingsCard } from "./ArticleSettingsCard";

interface ArticleFormProps {
  id: string;
}

export function ArticleForm({ id }: ArticleFormProps) {
  const {
    article,
    isNew,
    isLoading,
    isSaving,
    error,
    title,
    setTitle,
    sections,
    setSections,
    imageUrl,
    setImageUrl,
    type,
    setType,
    isFeatured,
    setIsFeatured,
    status,
    setStatus,
    handleSave,
    handlePublish,
  } = useArticleEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !article) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Нийтлэл олдсонгүй</h3>
        <Link href="/articles">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ArticleEditHeader
        isNew={isNew}
        articleId={id}
        status={status}
        title={title}
        isSaving={isSaving}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-6">
          <ArticleContentCard
            title={title}
            onTitleChange={setTitle}
            sections={sections}
            onSectionsChange={setSections}
          />
          <ArticlePreviewCard title={title} sections={sections} imageUrl={imageUrl} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ArticleSettingsCard
            status={status}
            onStatusChange={setStatus}
            type={type}
            onTypeChange={setType}
            isFeatured={isFeatured}
            onIsFeaturedChange={setIsFeatured}
          />
          <ArticleImageUploadCard
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            disabled={isSaving}
          />
          {!isNew && article && <ArticleInfoCard article={article} />}
        </div>
      </div>
    </div>
  );
}
