"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar } from "lucide-react";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/constants";
import type { Article } from "./types";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  const getContentPreview = (content: string | null) => {
    if (!content) return "Агуулга байхгүй";
    const stripped = content.replace(/<[^>]*>/g, "");
    return stripped.length > 100 ? stripped.slice(0, 100) + "..." : stripped;
  };

  return (
    <Link
      href={`/articles/${article.id}`}
      className="group flex flex-col border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="h-32 bg-muted flex items-center justify-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <Badge
            variant="secondary"
            className={CONTENT_STATUS_COLORS[article.status]}
          >
            {CONTENT_STATUS_LABELS[article.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {getContentPreview(article.content)}
        </p>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {article.published_at
              ? `Нийтэлсэн: ${formatDate(article.published_at)}`
              : `Үүсгэсэн: ${formatDate(article.created_at)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
