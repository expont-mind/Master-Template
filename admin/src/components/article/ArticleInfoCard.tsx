"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Article } from "./types";

interface ArticleInfoCardProps {
  article: Article;
}

export function ArticleInfoCard({ article }: ArticleInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн:</span>
          <span>{new Date(article.created_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>{new Date(article.updated_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</span>
        </div>
        {article.published_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Нийтэлсэн:</span>
            <span>
              {new Date(article.published_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
