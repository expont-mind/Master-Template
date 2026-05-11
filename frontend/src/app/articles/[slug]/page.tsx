import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArticleDetailClient } from "@/components/articles/ArticleDetailClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import type { Article } from "@/types/database";

export const revalidate = 300;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Shared fetcher: was previously called twice (generateMetadata + page).
// React.cache dedupes within a single request; Upstash dedupes across
// requests for 30 minutes (articles change rarely).
const getArticle = cache(async (slug: string): Promise<Article | null> =>
  getCachedOrFetch<Article | null>(
    cacheKeys.articleDetail(slug),
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      return (data as Article | null) ?? null;
    },
    1800,
  ),
);

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Нийтлэл олдсонгүй",
    };
  }

  return {
    title: article.title,
    description: article.content?.substring(0, 160) || `${article.title} - Monpang нийтлэл`,
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title: `${article.title} | Monpang`,
      description: article.content?.substring(0, 160) || `${article.title} - Monpang нийтлэл`,
      url: `https://monpang.com/articles/${slug}`,
      type: "article",
      images: article.image_url ? [{ url: article.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Monpang`,
      description: article.content?.substring(0, 160) || `${article.title} - Monpang нийтлэл`,
      images: article.image_url ? [article.image_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    console.error("[Article] Not found:", slug);
    notFound();
  }

  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Нийтлэл", url: "/articles" },
    { name: article.title, url: `/articles/${slug}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticleDetailClient article={article} />
    </>
  );
}
