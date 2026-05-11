import { createClient } from "@/lib/supabase/client";
import { log } from "@/lib/utils/logger";
import type { Article } from "@/types/database";

export const articleKeys = {
  all: ["articles"] as const,
  list: () => [...articleKeys.all, "list"] as const,
  detail: (slug: string) => [...articleKeys.all, "detail", slug] as const,
};

// Explicit column list matches the Article type in src/types/database.ts.
// Using `*` over-fetches every nullable text column for every list render.
const ARTICLE_COLUMNS =
  "id, title, slug, content, image_url, type, is_featured, status, published_at, created_at, updated_at";

export async function getArticles(): Promise<Article[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    log.error("articles_fetch_failed", { message: error.message });
    return [];
  }

  return (data as Article[]) ?? [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    log.error("article_fetch_failed", { message: error.message });
    return null;
  }

  return data as Article;
}
