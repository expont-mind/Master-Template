"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { ContentSection } from "@/components/article/ArticleContentCard";
import type { Article } from "@/components/article/types";
import type { ContentStatus } from "@/types/database";

function parseContentToSections(content: string | null): ContentSection[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map((s) => ({
        id: s.id || crypto.randomUUID(),
        title: s.title || "",
        content: s.content || "",
      }));
    }
  } catch {
    // If not JSON, return empty
  }
  return [];
}

function sectionsToContent(sections: ContentSection[]): string | null {
  if (sections.length === 0) return null;
  return JSON.stringify(
    sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
    })),
  );
}

function generateSlug(text: string): string {
  // Remove Mongolian/Cyrillic characters, only allow a-z and 0-9
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // If slug is empty (e.g., all Mongolian text), generate a random one
  if (!slug) {
    const random = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `article-${random}`;
  }
  return slug;
}

type ArticleSaveInput = {
  title: string;
  sections: ContentSection[];
  imageUrl: string;
  type: string;
  isFeatured: boolean;
  status: ContentStatus;
  slug: string;
  now: string;
  isNew: boolean;
  existingPublishedAt: string | null | undefined;
};

function buildArticlePayload(input: ArticleSaveInput): Record<string, unknown> {
  const base = {
    title: input.title.trim(),
    slug: input.slug || null,
    content: sectionsToContent(input.sections),
    image_url: input.imageUrl || null,
    type: input.type,
    is_featured: input.isFeatured,
    status: input.status,
  };
  if (input.isNew) {
    return {
      ...base,
      published_at: input.status === "published" ? input.now : null,
    };
  }
  const updateData: Record<string, unknown> = { ...base, updated_at: input.now };
  if (input.status === "published" && !input.existingPublishedAt) {
    updateData.published_at = input.now;
  }
  return updateData;
}

export function useArticleEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState("general");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<ContentStatus>("draft");

  const { data: article = null, isLoading } = useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => adminApi.getById<Article>("articles", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (article) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(article.title);
      setSections(parseContentToSections(article.content));
      setImageUrl(article.image_url || "");
      setType(article.type || "general");
      setIsFeatured(article.is_featured || false);
      setStatus(article.status);
    }
  }, [article]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? adminApi.insert("articles", data) : adminApi.update("articles", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      router.push("/articles");
    },
  });

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Нийтлэлийн гарчгийг заавал оруулна уу.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = buildArticlePayload({
      title,
      sections,
      imageUrl,
      type,
      isFeatured,
      status,
      slug: generateSlug(title),
      now: new Date().toISOString(),
      isNew,
      existingPublishedAt: article?.published_at,
    });

    try {
      await saveMutation.mutateAsync(payload);
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Нийтлэл хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setStatus("published");
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  return {
    article,
    isNew,
    isLoading,
    isSaving,
    error,
    title,
    setTitle: handleTitleChange,
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
  };
}
