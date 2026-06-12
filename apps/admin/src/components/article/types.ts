import type { ContentStatus } from "@/types/database";

export interface Article {
  id: string;
  title: string;
  slug: string | null;
  content: string | null;
  image_url: string | null;
  type: string;
  is_featured: boolean;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ARTICLE_TYPES = {
  general: "Ерөнхий",
  featured: "Онцлох",
  policy: "Бодлого",
  guide: "Заавар",
  news: "Мэдээ",
} as const;

export type ArticleType = keyof typeof ARTICLE_TYPES;
